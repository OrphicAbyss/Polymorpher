"use strict";



//
// Initial 8254 superset of the 8253 and has a higher clock speed ratings
//
//
//


/**
 * Intel 8253 & 8254 - Programmable Interrupt Timers used by early x86 computers
 *
 * They have 3 timers per chip and have 6 different modes for each timer.
 * 8254 is an enhanced 8253 with higher clock speed ratings.
 *
 * Historically Chip 1 manages the following
 * 0. Interrupt timer for time measurements in OS
 * 1. Timer for refreshing DRAM
 * 2. Timer for playing sounds on the PC speaker
 *
 * (Counter) (Format) (Mode) (BCD)
 *
 * (00) Set mode of counter 0
 * (01) Set mode of counter 1
 * (10) Set mode of counter 2
 * (11) Read-back command (8254 only)
 *
 * (00) Latch counter value. Next read of counter will read snapshot of value
 * (01) Read/Write low byte of counter only
 * (10) Read/Write high byte of counter only
 * (11) Read/Write low byte then high byte of counter value
 *
 * (000) Mode 0: Interrupt on terminal count
 * (001) Mode 1: Programmable one shot (Counter 2 only)
 * (x10) Mode 2: Rate generator
 * (x11) Mode 3: Square wave generator
 * (100) Mode 4: Software Triggered Strobe
 * (101) Mode 5: Hardware Triggered Strobe (Counter 2 only)
 *
 * (0) BCD 0: Counter is 16bit binary counter (0 - 65535)
 * (1) BCD 1: Counter is 4-digit binary coded decimal (0 - 9999)
 * Note BCD may not be implemented correctly in emulators or later chipsets because of limited use
 *
 * GATE high assumes normal operation modes, changes depend on mode:
 * Modes 0, 4: GATE low suspends counting, Gate high resumes counting
 * Modes 1, 5: Rising edge of GATE starts counting, subsequent rising edge restarts counter
 * Modes 2, 6: GATE low forces OUT high and resets counter, counting restarts on GATE high
 *
 * Ports:
 * 40h - Counter 0
 * 41h - Counter 1
 * 42h - Counter 2
 * 43h - Control Port
 *
 * IBM AT and later had a second chip
 * 50h - Counter 3
 * 51h - Counter 4
 * 52h - Counter 5
 * 53h - Control Port
 *
 * Gates:
 * Counter 0 - Always high?
 * Counter 1 - Always high?
 * Counter 1 - 61h - Bit 0
 *
 * Outputs:
 * Counter 0 - Connected to IRQ 0
 * Counter 1 - Connected to DMA controller channel 0 for DRAM refresh
 * Counter 2 - Connected to PC Speaker
 *
 * https://en.wikipedia.org/wiki/Intel_8253
 *
 * Timer 0 - 18.2 hz (configurable)
 * 1. OS sets value (FFFFh) of timer on the chip
 * 2. Timer counts down to 0
 * 3. Timer sends interrupt
 * 4. OS response to interrupt
 * 5. OS increments data at 0040:006c
 * 6. Start step 1 again
 *
 */
function HardwarePIT8254 (stdlib, foreign, heap) {
    "use asm";

    // use 8 bytes of heap per timer to store values
    const memByte = new stdlib.Int8Array(heap);

    const Timer0Set = 0;
    const Timer0Value = 2;
    const Timer0Latch = 4;
    const Timer0Mode = 6;
    const Timer0Access = 8;
    let Timer0Latched = 0;

    const Timer1Set = 10;
    const Timer1Value = 12;
    const Timer1Latch = 14;
    const Timer1Mode = 16;
    const Timer1Access = 18;
    let Timer1Latched = 0;

    const Timer2Set = 20;
    const Timer2Value = 22;
    const Timer2Latch = 24;
    const Timer2Mode = 26;
    const Timer2Access = 28;
    let Timer2Latched = 0;

    function handleCtl (byte) {
        const timers = 0b11000000;
        const timer0 = 0b00000000;
        const timer1 = 0b01000000;
        const timer2 = 0b10000000;
        const readBk = 0b11000000;

        const format = 0b00110000;
        const latchC = 0b00000000;
        const accessLo = 0b00010000;
        const accessHi = 0b00100000;
        const accessBi = 0b00110000;

        const modes = 0b00001110;
        const mode0 = 0b00000000;
        const mode1 = 0b00000010;
        const mode2 = 0b00000100;
        const mode3 = 0b00000110;
        const mode4 = 0b00001000;
        const mode5 = 0b00001010;
        const mode6 = 0b00001100;
        const mode7 = 0b00001110;

        const bitBCD = 0b00000001;

        let bcd = byte & bitBCD;    // seems to have limited support by emulators
        let timer = -1;
        let mode = -1;

        // get timer
        switch(byte & readBk) {
            case timer0:
                timer = 0;
                break;
            case timer1:
                timer = 1;
                break;
            case timer2:
                timer = 2;
                break;
            case readBk:
                // Not supported for PC XT
                timer = -1;
                break;
        }

        switch (byte & modes) {
            case mode0:
                mode = 1;
                break;
            case mode1:
                mode = 2;
                break;
            case mode2:
            case mode6: // 2 & 6 map to same mode
                mode = 3;
                break;
            case mode3:
            case mode7: // 3 & 7 map to same mode
                mode = 4;
                break;
            case mode4:
                mode = 5;
                break;
            case mode5:
                mode = 6;
                break;
        }

        switch (byte & format) {
            case latchC:
                // latch command ignores Mode and BCD
                // Just copy the value to the latch
                switch (timer) {
                    case 0:
                        memByte[Timer0Latch] = memByte[Timer0Value];
                        memByte[Timer0Latch + 1] = memByte[Timer0Value + 1];
                        Timer0Latched = 1;
                        break;
                    case 1:
                        memByte[Timer1Latch] = memByte[Timer1Value];
                        memByte[Timer1Latch + 1] = memByte[Timer1Value + 1];
                        Timer1Latched = 1;
                        break;
                    case 2:
                        memByte[Timer2Latch] = memByte[Timer2Value];
                        memByte[Timer2Latch + 1] = memByte[Timer2Value + 1];
                        Timer2Latched = 1;
                        break;
                }
                break;
            case accessLo:
            case accessHi:
            case accessBi:
                switch (timer) {
                    case 0:
                        memByte[Timer0Mode] = mode;
                        memByte[Timer0Access] = format + 1;
                        break;
                    case 1:
                        memByte[Timer1Mode] = mode;
                        memByte[Timer1Access] = format + 1;
                        break;
                    case 2:
                        memByte[Timer2Mode] = mode;
                        memByte[Timer2Access] = format + 1;
                        break;
                }
                break;
        }
    }

    function handleTimerRead (timerAccess, timerValue) {
        timerAccess = timerAccess | 0;
        timerValue = timerValue | 0;
        let value = null;

        switch (memByte[timerAccess]) {
            case 1:
                value = memByte[timerValue];
                memByte[timerAccess] = 0;
                break;
            case 2:
                value = memByte[timerValue + 1];
                memByte[timerAccess] = 0;
                break;
            case 3:
                value = memByte[timerValue];
                memByte[timerAccess] = 2;
                break;
        }

        return value | 0;
    }

    function handleTimer0Read () {
        let value = null;

        if (Timer0Latched) {
            value = handleTimerRead(Timer0Access, Timer0Latch);
            if (memByte[Timer0Access] === 0) {
                Timer0Latched = 0;
            }
        } else {
            value = handleTimerRead(Timer0Access, Timer0Value);
        }

        return value | 0;
    }

    function handleTimer1Read () {
        let value = null;

        if (Timer1Latched) {
            value = handleTimerRead(Timer1Access, Timer1Latch);
            if (memByte[Timer1Access] === 0) {
                Timer1Latched = 0;
            }
        } else {
            value = handleTimerRead(Timer1Access, Timer1Value);
        }

        return value | 0;
    }

    function handleTimer2Read () {
        let value = null;

        if (Timer2Latched) {
            value = handleTimerRead(Timer2Access, Timer2Latch);
            if (memByte[Timer2Access] === 0) {
                Timer2Latched = 0;
            }
        } else {
            value = handleTimerRead(Timer2Access, Timer2Value);
        }

        return value | 0;
    }

    function handleTimerWrite (timerAccess, timerSet, byte) {
        timerAccess = timerAccess | 0;
        timerSet = timerSet | 0;
        byte = byte | 0;

        switch (memByte[timerAccess]) {
            case 1:
                memByte[timerSet] = byte;
                memByte[timerAccess] = 0;
                break;
            case 2:
                memByte[timerSet + 1] = byte;
                memByte[timerAccess] = 0;
                break;
            case 3:
                memByte[timerSet] = byte;
                memByte[timerAccess] = 2;
                break;
        }
    }

    function handleTimer0Write (byte) {
        byte = byte | 0;

        handleTimerWrite(Timer0Access, Timer0Set, byte);
    }

    function handleTimer1Write (byte) {
        byte = byte | 0;

        handleTimerWrite(Timer1Access, Timer1Set, byte);
    }

    function handleTimer2Write (byte) {
        byte = byte | 0;

        handleTimerWrite(Timer2Access, Timer2Set, byte);
    }

    function tick () {

    }

    return {
        handleCtl,
        handleTimer0Read,
        handleTimer1Read,
        handleTimer2Read,
        handleTimer0Write,
        handleTimer1Write,
        handleTimer2Write,
        tick
    }
}
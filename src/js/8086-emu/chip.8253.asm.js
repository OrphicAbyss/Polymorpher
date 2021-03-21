"use strict";

/**
 * This file simulates a Intel 8253 chip. There are 3 parts to this:
 *
 * 1. createDebug function: this allows for timing diagrams to be generated to help with debugging.
 * 2. SingleTimer function: this implements a single timer component.
 * 3. HardwarePIT8253 function: this groups 3 SingleTimer functions to implement the 8253 api for an IBM XT machine
 *
 * Early systems only had one of these chips, later systems had two. Minor changes to HardwarePIT8253 would be
 * required to cover the extra ports needed for these machines and to add another 3 timers.
 *
 * The Intel 8254 is a superset of the 8253 adding an extra set of control commands. The HardwarePIT8253 would
 * need upgrading to support the new commands and the SingleTimer would need to support latching the new status format.
 *
 * Currently the code is not fully asm.js compliant but they are close for SingleTimer and HardwarePIT8253. createDebug
 * doesn't make any effort to be compliant currently and uses array operations and object. It should be possible to
 * make the debugging code compliant if it's given a fixed length of array sizes and made to use a buffer for data.
 */

/**
 * Debugging function
 *
 * This allows for the creation of timing diagrams that can be pasted into https://wavedrom.com/editor.html
 * These should be a big help with debugging
 *
 * @param chip
 * @return {{add: addData, test: addTest, break: addBreak, render: (function(*=): {head: {text: *, tick: number}, signal: ({data: *, name: string, wave: *}|{name: string, wave: *})[], config: {hscale: number}}), addChip: addChipData}}
 */
function createDebug (chip) {
    const data = {
        "clock": ["p"],
        "test": ["x"],
        "testValue": []
    };

    if (chip) {
        data["out0"] = ["x"];
        data["out1"] = ["x"];
        data["out2"] = ["x"];
        data["gate0"] = ["x"];
        data["gate1"] = ["x"];
        data["gate2"] = ["x"];
        data["port"] = ["x"];
        data["portValue"] = [];
        data["bus"] = ["x"];
        data["busValue"] = [];
    } else {
        data["output"] = ["x"];
        data["gate"] = ["x"];
        data["count"] = ["x"];
        data["countValue"] = [];
        data["set"] = ["x"];
        data["setValue"] = [];
    }

    function eqLast (field, value) {
        const test = data[field].filter(item => item !== "." && item !== "|").map(item => item === value);

        return test.length > 0 && test[test.length - 1];
    }

    function eqLastUpdate(key, value) {
        if (eqLast(key, value)) {
            data[key].push(".");
        } else {
            data[key].push(value);
        }
    }

    function addData (output, gate, count, set) {
        data.clock.push(".");

        eqLastUpdate("output", output);
        eqLastUpdate("gate", gate);

        if (!eqLast("countValue", count.toString(16))) {
            data.count.push("=");
            data.countValue.push(count.toString(16));
        } else {
            data.count.push(".");
        }

        if (!eqLast("setValue", set.toString(16))) {
            data.set.push("=");
            data.setValue.push(set.toString(16));
        } else {
            data.set.push(".");
        }
    }

    function addChipData(out0, out1, out2, gate0, gate1, gate2, bus, port) {
        data.clock.push(".");

        eqLastUpdate("out0", out0);
        eqLastUpdate("out1", out1);
        eqLastUpdate("out2", out2);
        eqLastUpdate("gate0", gate0);
        eqLastUpdate("gate1", gate1);
        eqLastUpdate("gate2", gate2);

        if (bus !== null) {
            data.bus.push("=");
            data.busValue.push(bus);
        } else {
            data.bus.push("x");
        }

        if (port !== null) {
            data.port.push("=");
            data.portValue.push(port);
        } else {
            data.port.push("x");
        }
    }

    function addBreak () {
        if (data.test[data.test.length - 1] === "|") {
            data.test.push("x");
        }
        for (let i = data.test.length; i < data.clock.length; i++) {
            data.test.push(".");
        }

        // add "|" to all non value signals
        Object.keys(data)
            .filter(key => !key.endsWith("Value"))
            .forEach(key => data[key].push("|"));
    }

    function addTest (name) {
        data.test.push("=");
        data.testValue.push(name);
    }

    function getGraph (header) {
        for (let i = data.test.length; i < data.clock.length; i++) {
            data.test.push(".");
        }

        // add end of signal markers
        Object.keys(data)
            .filter(key => !key.endsWith("Value"))
            .forEach(key => {
                data[key].push(key === "clock" ? "." : "x");
            });

        // get value signals
        const valueSignals = Object.keys(data)
            .filter(key => key.endsWith("Value"))
            .map(key => key.replace("Value",""));


        return {
            signal: Object.keys(data).filter(name => !name.endsWith("Value")).map((name) => {
                if (valueSignals.includes(name)) {
                    return {
                        name: name,
                        wave: data[name].join(""),
                        data: data[name + "Value"]
                    };
                } else {
                    return {
                        name: name,
                        wave: data[name].join("")
                    };
                }
            }),
            head:{
                text: header,
                tick:0,
            },
            config: {
                hscale: 1.5
            }
        };
    }

    return {
        add: addData,
        addChip: addChipData,
        test: addTest,
        break: addBreak,
        render: getGraph
    };
}

function SingleTimer (debug) {
    "use asm";

    // constants
    const ACCESS_MODE_NONE = 0;
    const ACCESS_MODE_HIGH_ONLY = 1;
    const ACCESS_MODE_LOW_ONLY = 2;
    const ACCESS_MODE_LOW_HIGH = 3;

    const COUNT_PAUSE = 0;
    const COUNT_RUN = 1;
    const COUNT_RELOAD = 2;
    const COUNT_LOAD = 3;

    const HIGH = 1;
    const LOW = 0;

    // statuses
    let latched = 0;
    let accessMode = ACCESS_MODE_NONE;
    let timerMode = 0;
    let counting = COUNT_PAUSE;
    // in/out values
    let gateValue = HIGH;
    let outValue = 0;

    // values
    let setValue = 0xffff;
    let counterValue = 0xffff;
    let latchValue = 0xffff;


    function setTimerMode (mode) {
        mode = mode | 0;

        timerMode = mode;

        switch (mode) {
            case 0:
                // for mode 0 - out goes low on control word
                outValue = 0;
                break;
            case 1:
            case 2:
            case 3:
            case 4:
                // for mode 1, 2, 3, 4 - out goes high on control word / value
                outValue = 1;
                break;
            case 5:
                // for mode 5 - out goes high on control word / value
                outValue = 1;
                break;
        }
    }

    function setAccessMode (mode) {
        mode = mode | 0;

        accessMode = mode;
    }

    function setLatch () {
        latchValue = counterValue;
        latched = true;
    }

    function setGate (value) {
        value = value | 0;

        // gate switching between low (0) and high (1) can trigger specific actions
        if (value === HIGH && gateValue === LOW) {
            switch (timerMode) {
                case 1:
                case 5:
                    // 1, 5 - rising gate starts / restarts counting
                    counting = COUNT_RELOAD;
                    break;
                case 2:
                case 3:
                    //counterValue = setValue;
                    counting = COUNT_RELOAD;
                    break;
                case 0:
                case 4:
                    // 0, 4 - gate high continues counting
                    // 2, 3 - counter was reset on gate low
                    counting = COUNT_RUN;
                    break;
            }
        } else if (value === LOW && gateValue === HIGH) {
            switch (timerMode) {
                case 0:
                case 4:
                    counting = COUNT_PAUSE;
                    break;
                case 2:
                case 3:
                    // out goes high, counter reset on falling clock
                    outValue = HIGH;
                    counting = COUNT_PAUSE;
                    break;
            }
        } else {
            // else - no change to gate (why call?)
        }

        gateValue = value;
    }

    function getGate() {
        return gateValue | 0;
    }

    function getOut () {
        return outValue | 0;
    }

    function readByte () {
        var value = latched ? latchValue : counterValue;

        switch (accessMode) {
            case ACCESS_MODE_NONE:
                // undefined
                return 0;
            case ACCESS_MODE_HIGH_ONLY:
                accessMode = ACCESS_MODE_NONE;
                latched = false;
                return (value >> 8) | 0;
            case ACCESS_MODE_LOW_ONLY:
                accessMode = ACCESS_MODE_NONE;
                latched = false;
                return (value & 0xff) | 0;
            case ACCESS_MODE_LOW_HIGH:
                accessMode = ACCESS_MODE_HIGH_ONLY;
                return (value & 0xff) | 0;
        }
    }

    function writeByte (value) {
        value = value | 0;

        switch (accessMode) {
            case ACCESS_MODE_NONE:
                // undefined
                break;
            case ACCESS_MODE_HIGH_ONLY:
                accessMode = ACCESS_MODE_NONE;
                setValue = (value & 0xff) << 8 | (0x00ff & setValue);
                break;
            case ACCESS_MODE_LOW_ONLY:
                accessMode = ACCESS_MODE_NONE;
                setValue = value & 0xff | (0xff00 & setValue);
                break;
            case ACCESS_MODE_LOW_HIGH:
                accessMode = ACCESS_MODE_HIGH_ONLY;
                setValue = value & 0xff | (0xff00 & setValue);
                break;
        }

        // noinspection FallThroughInSwitchStatementJS
        switch (timerMode) {
            case 2:
            case 3:
                // in mode 2 - out starts high until it reaches 1
                outValue = 1;
                if (gateValue === LOW) {
                    break;
                }
            case 0:
            case 4:
                // in mode 0, 2 - writing stops counting until full value written
                if (accessMode === ACCESS_MODE_NONE) {
                    counting = COUNT_LOAD;
                }
                break;
        }
    }

    function tick () {
        // clock rising edge

        // tick action
        if (counting === COUNT_RUN) {
            counterValue = counterValue - 1;

            switch (timerMode) {
                case 0:
                    if (counterValue === 0) {
                        outValue = HIGH;
                    }
                    break;
                case 1:
                    if (counterValue === 0) {
                        outValue = HIGH;
                        counting = COUNT_PAUSE;
                    }
                    break;
                case 2:
                    if (counterValue === 1) {
                        // for mode 2 - out goes low for one clock when it gets to 1
                        outValue = 0;
                    }
                    if (counterValue === 0) {
                        // for mode 2 - out goes high and timer restarts when it reaches 0
                        counterValue = setValue;
                        outValue = 1;
                    }
                    break;
                case 3:
                    if (counterValue + 1 === setValue && (setValue & 0b01) === 1) {
                        // for first decrement and setValue is odd
                        // first loop -1 (no extra decrement)
                        // second loop -3 (extra decrement
                        if (outValue === LOW) {
                            counterValue = counterValue - 2;
                        }
                    } else {
                        // normally decrement by 2 instead of 1
                        counterValue = counterValue - 1;
                    }

                    if (counterValue === 0) {
                        // for mode 3 - timer restarts when it reaches 0
                        counterValue = setValue;
                        // toggle out value for each loop
                        if (outValue === HIGH) {
                            outValue = LOW;
                        } else {
                            outValue = HIGH;
                        }
                    }
                    break;
                case 4:
                    if (counterValue === 0) {
                        outValue = 0;
                    } else if (outValue === 0) {
                        // if out has been low for one tick, set it back to high
                        outValue = 1;
                    }
                    break;
                case 5:
                    if (counterValue === 0) {
                        outValue = 0;
                    } else if (outValue === 0) {
                        // if out has been low for one tick, set it back to high
                        outValue = 1;
                    }
                    break;
            }

            if (counterValue < 0) {
                // counter can't go negative, it wraps around to 0xffff;
                counterValue = 0xffff;
            }
        }

        // clock falling edge
        if (counting === COUNT_RELOAD) {
            counterValue = setValue;

            if (timerMode === 1) {
                //out goes low after trigger
                outValue = LOW;
            }

            counting = COUNT_RUN;
        } else if (counting === COUNT_LOAD) {
            counting = COUNT_RELOAD;
        }

        // add debug
        if (debug) {
            debug.add(outValue, gateValue, counterValue, setValue);
        }
    }

    function log () {
        console.log("Access", accessMode, "Mode", timerMode, "Gate", gateValue, "Out", outValue, "Counter", counterValue, "Set", setValue);
    }

    return {
        ACCESS_MODE_HIGH_ONLY,
        ACCESS_MODE_LOW_ONLY,
        ACCESS_MODE_LOW_HIGH,
        setAccessMode,
        setTimerMode,
        setLatch,
        setGate,
        getGate,
        getOut,
        readByte,
        writeByte,
        tick,
        log
    };
}

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
 * Counter 2 - 61h - Bit 1 (bit 0 enables speaker)
 *
 * Outputs:
 * Counter 0 - Connected to IRQ 0
 * Counter 1 - Connected to DMA controller channel 0 for DRAM refresh
 * Counter 2 - Connected to PC Speaker (Bit 5 of Port 62h)
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

function HardwarePIT8253 (stdlib, foreign, heap) {
    // use 8 bytes of heap per timer to store values
    const memByte = new stdlib.Int8Array(heap.buffer);
    const debug = foreign.debug && foreign.debug.chip;
    let portValue = null;
    let busValue = null;

    const timerObj0 = SingleTimer(foreign.debug && foreign.debug.timer0);
    const timerObj1 = SingleTimer(foreign.debug && foreign.debug.timer1);
    const timerObj2 = SingleTimer(foreign.debug && foreign.debug.timer2);

    function handleCtl (byte) {
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

        const gate = 0b01000000;
        const out = 0b00100000;

        let bcd = byte & bitBCD;    // seems to have limited support by emulators
        let timer = -1;
        let mode = -1;

        // get timer
        switch (byte & readBk) {
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
                mode = 0;
                break;
            case mode1:
                mode = 1;
                break;
            case mode2:
            case mode6: // 2 & 6 map to same mode
                mode = 2;
                break;
            case mode3:
            case mode7: // 3 & 7 map to same mode
                mode = 3;
                break;
            case mode4:
                mode = 4;
                break;
            case mode5:
                mode = 5;
                break;
        }

        switch (byte & format) {
            case latchC:
                // latch command ignores Mode and BCD
                // Just copy the value to the latch
                switch (timer) {
                    case 0:
                        timerObj0.setLatch();
                        break;
                    case 1:
                        timerObj1.setLatch();
                        break;
                    case 2:
                        timerObj2.setLatch();
                        break;
                }
                break;
            case accessLo:
            case accessHi:
            case accessBi:
                switch (timer) {
                    case 0:
                        timerObj0.setTimerMode(mode);
                        timerObj0.setAccessMode((byte & format) >> 4);
                        break;
                    case 1:
                        timerObj1.setTimerMode(mode);
                        timerObj1.setAccessMode((byte & format) >> 4);
                        break;
                    case 2:
                        timerObj2.setTimerMode(mode);
                        timerObj2.setAccessMode((byte & format) >> 4);
                        break;
                }
                break;
        }
    }

    function tick () {
        timerObj0.tick();
        timerObj1.tick();
        timerObj2.tick();

        if (debug) {
            debug.addChip(
                timerObj0.getOut(),
                timerObj1.getOut(),
                timerObj2.getOut(),
                timerObj0.getGate(),
                timerObj1.getGate(),
                timerObj2.getGate(),
                busValue,
                portValue
            );
            portValue = null;
            busValue = null;
        }
    }

    function handlePortWrite(port, value) {
        port = port | 0;
        value = value | 0;

        portValue = port.toString(16) + "h";
        busValue = value.toString(2);

        // 44h - 5fh are aliased to 40 - 43
        if ((port & 0xF0) === 0x50) {
            // convert 0x5?h to 0x4?h
            port = port & 0xf | 0x40;
        }

        if ((port & 0xF0) === 0x40 && (port & 0x0F) > 3) {
            // covert 0x4?h to 0x40 - 0x43
            port = port & 0xf3;
        }

        switch (port) {
            case 0x40:
                timerObj0.writeByte(value);
                break;
            case 0x41:
                timerObj1.writeByte(value);
                break;
            case 0x42:
                timerObj2.writeByte(value);
                break;
            case 0x43:
                handleCtl(value);
                break;
            case 0x61:
                value = value & 0b00000001;
                timerObj2.setGate(value);
                break;
        }
    }

    function handlePortRead(port) {
        port = port | 0;
        let output = 0;

        switch (port) {
            case 0x40:
                output = timerObj0.readByte();
                break;
            case 0x41:
                output = timerObj1.readByte();
                break;
            case 0x42:
                output = timerObj2.readByte();
                break;
            case 0x43:
                break;
            case 0x61:
                output = output | (timerObj2.getGate() & 0b00000001);
                output = output | (timerObj2.getOut() << 4);
                break;
        }

        return output | 0;
    }

    return {
        handlePortWrite,
        handlePortRead,
        tick
    };
}


exports.DebugObject = createDebug;
exports.SingleTimer = SingleTimer;
exports.HardwarePIT8253 = HardwarePIT8253;

"use strict";

/**
 * This file simulates a Intel 8259 chip.
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

    let levels = [];
    let values = [];

    if (chip) {
        levels = ["cPin", "aPin", "SNGL", "IC4", "ADI", "LTIM", "SFNM", "BUF", "PC", "AEOI", "uPM"];
        values = ["IMR", "IRR", "ISR", "data", "a", "c", "t"]
    } else {

    }

    levels.forEach((item) => {
        data[item] = ["x"];
    });
    values.forEach((item) => {
        data[item] = ["x"];
        data[item + "Value"] = [];
    });

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

    function eqLastValueUpdate(key, value) {
        const keyValue = key + "Value";
        if (eqLast(keyValue, value.toString(16))) {
            data[key].push(".");
        } else {
            data[key].push("=");
            data[keyValue].push(value.toString(16));
        }
    }

    function addData (inData) {
        data.clock.push(".");

        Object.keys(inData).filter((key) => levels.includes(key)).forEach((key) => {
            eqLastUpdate(key, inData[key]);
        });

        Object.keys(inData).filter((key) => values.includes(key)).forEach((key) => {
            eqLastValueUpdate(key, inData[key]);
        });
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

function Chip8259 (cPin, debug) {
    // main registers
    let IMR = 0; // interrupt mask register
    let IRR = 0; // interrupt request register
    let ISR = 0; // in service register

    const ICW_NONE = 0;
    const ICW_1 = 1;
    const ICW_2 = 2;
    const ICW_3 = 3;
    const ICW_4 = 4;
    const ICW_DONE = 5;

    let aPin = 0;
    let ICW = 0;
    let data = 0;

    let SNGL = 0;   // 0 for cascade mode, 1 for single chip
    let IC4 = 0;    // 0 for 80/85 mode, 1 for x86
    let ADI = 0;    // 0 for interval of 8, 1 for interval of 4 (Call address interval)
    let LTIM = 0;   // 0 for edge trig, 1 for level trig

    let aValue = 0; // Interrupt vector address (80/85 mode)
    let tValue = 0; // Interrupt vector address (x86 mode)
    let cValue = 0; // Interrupt mask of slaves
    let cId = 0;     // Int Id on parent chip

    let SFNM = 0;   // Special Fully-Nested Mode - allows multiple interrupts to be processed
    let BUF = 0;    // Indicates buffered mode
    let PC = 0;     // Indicate if this is a parent or child
    let AEOI = 0;   // Automatic End Of Interrupt
    let uPM = 0;    // Select mode, 0 is 80/85 mode, 1 is x86 mode

    let SMM = 0;    // Special Mask Mode

    function setAPin (value) {
        value = value | 0;

        aPin = value & 0b01;
    }

    function handleCW (value) {
        value = value | 0;
        data = value;

        // Check if ICW
        if (aPin === 0 && (value & 0b00010000)) {
            ICW = ICW_1;
            // clear interrupt mask register
            IMR = 0;
            // clear special mask mode
            SMM = 0;
            // TODO: Status Read set to IRR
            // zero out settings from ICW4 - currently done at end of init
        }

        if (ICW !== ICW_DONE) {
            // handle ICW
            switch (ICW) {
                case ICW_1:
                    IC4 = (value & 0b00000001) >> 0;
                    SNGL = (value & 0b00000010) >> 1;
                    ADI = (value & 0b00000100) >> 2;
                    LTIM = (value & 0b00001000) >> 3;
                    aValue = (value & 0b11100000);
                    break;
                case ICW_2:
                    if (IC4 === 0) {
                        // 80/85 mode
                        aValue = (value < 8) | aValue;
                    } else {
                        // x86 mode
                        aValue = ((value & 0b00000111) << 8) | aValue;
                        tValue = (value & 0b11111000);
                    }
                    break;
                case ICW_3:
                    if (cPin === 0) {
                        cValue = value;
                    } else {
                        cId = value & 0b00000111;
                    }
                    break;
                case ICW_4:
                    uPM = (value & 0b00000001) >> 0;
                    AEOI = (value & 0b00000010) >> 1;
                    PC = (value & 0b00000100) >> 2;
                    BUF = (value & 0b00001000) >> 3;
                    SFNM = (value & 0b00010000) >> 4;
                    break;
            }

            // setup to handle next control word
            ICW = ICW + 1;

            // in single chip mode, ICW3 is skipped
            if (ICW === ICW_3 && SNGL === 1) {
                ICW = ICW_4;
            }

            // in 80/85 mode
            if (ICW === ICW_4 && IC4 === 0) {
                ICW = ICW_DONE;
                // default all values to 0
                uPM = 0;
                AEOI = 0;
                PC = 0;
                BUF = 0;
                SFNM = 0;
            }
        } else {
            // handle OCW

        }
    }

    function isInitialised() {
        return ICW === ICW_DONE ? 1 : 0;
    }

    function setIR(pin) {
        pin = pin | 0;

        if (pin >= 0 && pin <= 7) {
            // set the bit flag for interrupt
            IRR = IRR | (0b1 << pin);
        }
    }

    function tick () {
        if (ISR === 0) {

        }

        if (debug) {
            debug.add({
                IMR,
                IRR,
                ISR,
                cPin,
                aPin,
                ICW,
                SNGL,
                IC4,
                ADI,
                LTIM,
                uPM,
                AEOI,
                PC,
                BUF,
                SFNM,
                a: aValue,
                t: tValue,
                c: cValue,
                data
            });
        }
    }

    return {
        setAPin,
        handleCW,
        isInitialised,
        setIR,
        tick
    };
}

/**
 * The Programmable Interrupt Controller 8259 waits for an interrupt line to be signaled.
 * This sets off the following sequence:
 *
 * 1. Interrupt Request line is set high, corresponding IRR bit is set high
 * 2. If interrupt isn't masked, then signals the cpu
 * 3. CPU acknowledges signal
 * 4. The highest prioity ISR bit is set and the same IRR bit is cleared
 * 5. CPU sends second acknowledgement and an 8bit pointer is set to be read on the data bus
 * 6. In AEOI mode the ISR bit is reset, otherwise the ISR bit remains until an EOI command sent
 */
function HardwarePIC8259 () {
    let portValue = null;
    let busValue = null;
    let latchValue = null;

    let ISR, IRR, IMR;

    function tick () {

    }

    function handleCommand (value) {
        value = value | 0;

        switch (value) {
            case 0x20:
                // End of interrupt
                ISR = 0;
                break;
            case 0x0a:
                // Read IRR next
                latchValue = IRR;
                break;
            case 0x0b:
                // Read ISR next
                latchValue = ISR;
                break;
        }
    }

    function handlePortWrite (port, value) {
        port = port | 0;
        value = value | 0;

        portValue = port.toString(16) + "h";
        busValue = value.toString(2);

        switch (port) {
            case 0x20:
                // command
                // sets A0 pin to 0
                handleCommand(value);
                break;
            case 0x21:
                // sets A0 pin to 1
                IMR = value;
                break;
            case 0xA0:
                // not implemented
                // sets A0 pin to 0
                break;
            case 0xA1:
                // not implemented
                // sets A0 pin to 1
                break;
        }
    }

    function handlePortRead (port) {
        port = port | 0;
        let output = 0;

        switch (port) {
            case 0x20:
                // parent - command - on all machines
                break;
            case 0x21:
                // parent - data - on all machines
                output = IMR;
                break;
            case 0xA0:
                // child - command - not on XT, AT and later
                break;
            case 0xA1:
                // child - data - not on XT, AT and later
                break;
        }

        return output | 0;
    }

    /**
     * Set or unset an interrupt
     *
     * @param irq The interrupt to change
     */
    function setInterrupt (irq) {
        irq = irq | 0;

        // calculate irq bit, mask against IMR for enabled interrupts and combine into interrupt request register
        IRR = IRR | ((1 << irq) & IMR);
    }

    function acknowledgeInterrupt () {
        // if ISR is clear
        if (ISR === 0 && IRR > 0) {
            // handle next interrupt
            for (let irq = 0; irq < 8; irq++) {
                let irqMask = (1 << irq);
                if ((IRR & irqMask) > 0) {
                    // clear IRR for irq
                    IRR = IRR ^ irqMask;
                    // set ISR for irq
                    ISR = irqMask;
                    // break to exit loop
                    break;
                }
            }
        } else if (ISR !== 0) {
            for (let irq = 0; irq < 8; irq++) {
                if ((1<< irq) === ISR) {
                    busValue = irq;
                    break;
                }
            }
        }
    }

    return {
        setInterrupt,
        handlePortWrite,
        handlePortRead,
        acknowledgeInterrupt,
        tick
    };
}

exports.DebugObject = createDebug;
exports.Chip8259 = Chip8259;
exports.HardwarePIC8259 = HardwarePIC8259;

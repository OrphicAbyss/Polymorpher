"use strict";

const assert = require("assert");
const chip = require("../src/js/8086-emu/chip.8259.asm");

let interrupt = null;
let debug = null;

function init() {
    interrupt.setAPin(0);
    interrupt.handleCW(0b00010011);
    interrupt.tick();
    interrupt.setAPin(1);
    interrupt.handleCW(0b11111000);
    interrupt.tick();
    interrupt.handleCW(0b00000001);
    interrupt.tick();
}

describe("Chip i8259", function () {
    describe("Initialise chip", function () {
        before(function () {
            debug = chip.DebugObject(true);
            interrupt = chip.Chip8259(0, debug);
        });

        beforeEach(function () {
            debug.break();
        });

        after(function () {
            console.log(JSON.stringify(debug.render()));
        });

        it("Setup single chip for x86", function () {
            debug.test("Init x86 single");

            init();

            // DONE!
            assert.strictEqual(interrupt.isInitialised(), 1, "Interrupt chip should now be initialised.");
        });
    });

    describe("Interrupt handling", function () {
        before(function () {
            debug = chip.DebugObject(true);
            interrupt = chip.Chip8259(0, debug);
        });

        beforeEach(function () {
            debug.break();
        });

        after(function () {
            console.log(JSON.stringify(debug.render()));
        });

        it("IRQ0", function () {
            debug.test("IRQ0");

            init();

            interrupt.setIR(0);
            interrupt.tick();
        });

        it("IRQ1", function () {
            debug.test("IRQ1");

            init();

            interrupt.setIR(1);
            interrupt.tick();
        });
    });
});

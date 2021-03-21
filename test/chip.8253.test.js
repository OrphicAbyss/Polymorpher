"use strict";

const assert = require("assert");
const chip = require("../src/js/8086-emu/chip.8253.asm");

let timer = chip.SingleTimer();
let debug = null;
const count = 4;

function writeCounter (value) {
    // optionally use value passed as count
    value = value || count;
    timer.setAccessMode(timer.ACCESS_MODE_LOW_HIGH);
    timer.writeByte(value & 0xff);
    timer.tick();
    timer.writeByte((value & 0xff00) << 8);
}

function readCounter () {
    timer.setAccessMode(timer.ACCESS_MODE_LOW_HIGH);
    let readCount = timer.readByte();
    readCount = readCount | (timer.readByte() << 8);

    return readCount;
}

describe("Write & Read", function () {
    before(function () {
        debug = chip.DebugObject();
        timer = chip.SingleTimer(debug);
    });

    beforeEach(function () {
        debug.break();
    });

    after(function () {
        console.log(JSON.stringify(debug.render()));
    });

    it("Value written in can be read out", function () {
        debug.test("Read written value");
        timer.setGate(0);
        timer.setTimerMode(0);

        timer.setAccessMode(timer.ACCESS_MODE_LOW_HIGH);
        timer.writeByte(0x60);
        timer.tick();
        timer.writeByte(0x30);
        timer.tick();
        timer.tick();

        // counter immediately set in mode 0
        timer.setAccessMode(timer.ACCESS_MODE_LOW_HIGH);
        assert.strictEqual(timer.readByte(), 0x60);
        assert.strictEqual(timer.readByte(), 0x30);
        assert.strictEqual(timer.readByte(), 0x0); // undefined

        timer.setAccessMode(timer.ACCESS_MODE_HIGH_ONLY);
        assert.strictEqual(timer.readByte(), 0x30);
        assert.strictEqual(timer.readByte(), 0x0); // undefined

        timer.setAccessMode(timer.ACCESS_MODE_LOW_ONLY);
        assert.strictEqual(timer.readByte(), 0x60);
        assert.strictEqual(timer.readByte(), 0x0); // undefined

        timer.tick();
    });

    it("Value can overwrite high only", function () {
        debug.test("Overwrite high only");
        timer.setGate(0);
        timer.setTimerMode(0);

        timer.setAccessMode(timer.ACCESS_MODE_LOW_HIGH);
        timer.writeByte(60);
        timer.tick();
        timer.writeByte(30);
        timer.tick();

        timer.setAccessMode(timer.ACCESS_MODE_LOW_ONLY);
        timer.writeByte(100);
        timer.tick();
        timer.tick();

        timer.setAccessMode(timer.ACCESS_MODE_LOW_ONLY);
        assert.strictEqual(timer.readByte(), 100);
        timer.setAccessMode(timer.ACCESS_MODE_HIGH_ONLY);
        assert.strictEqual(timer.readByte(), 30);
    });

    it("Value can overwrite low only", function () {
        debug.test("Overwrite low only");
        timer.setGate(0);
        timer.setTimerMode(0);

        timer.setAccessMode(timer.ACCESS_MODE_LOW_HIGH);
        timer.writeByte(60);
        timer.tick();
        timer.writeByte(30);
        timer.tick();

        timer.setAccessMode(timer.ACCESS_MODE_HIGH_ONLY);
        timer.writeByte(100);
        timer.tick();
        timer.tick();

        timer.setAccessMode(timer.ACCESS_MODE_LOW_ONLY);
        assert.strictEqual(timer.readByte(), 60);
        timer.setAccessMode(timer.ACCESS_MODE_HIGH_ONLY);
        assert.strictEqual(timer.readByte(), 100);
    });

    it("Latched read is the same as the count", function () {
        debug.test("Latched value matches count");
        timer.setGate(0);
        timer.setTimerMode(0);

        timer.setAccessMode(timer.ACCESS_MODE_LOW_HIGH);
        timer.writeByte(60);
        timer.tick();
        timer.writeByte(30);
        timer.tick();
        timer.tick();

        timer.setLatch();

        // read latch
        timer.setAccessMode(timer.ACCESS_MODE_LOW_ONLY);
        assert.strictEqual(timer.readByte(), 60);
        timer.setAccessMode(timer.ACCESS_MODE_HIGH_ONLY);
        assert.strictEqual(timer.readByte(), 30);

        // read counter
        timer.setAccessMode(timer.ACCESS_MODE_LOW_ONLY);
        assert.strictEqual(timer.readByte(), 60);
        timer.setAccessMode(timer.ACCESS_MODE_HIGH_ONLY);
        assert.strictEqual(timer.readByte(), 30);
    });

    it("Latched value doesn't change on tick", function () {
        debug.test("Latched value doesn't inc");
        timer.setGate(0);
        timer.setTimerMode(0);

        timer.setAccessMode(timer.ACCESS_MODE_LOW_HIGH);
        timer.writeByte(60);
        timer.tick();
        timer.writeByte(30);
        timer.tick();
        timer.tick();

        timer.setLatch();
        timer.setGate(1);
        timer.tick(); // first tick is set value

        // read latch
        timer.setAccessMode(timer.ACCESS_MODE_LOW_ONLY);
        assert.strictEqual(timer.readByte(), 60);
        timer.setAccessMode(timer.ACCESS_MODE_HIGH_ONLY);
        assert.strictEqual(timer.readByte(), 30);

        // read counter
        timer.setAccessMode(timer.ACCESS_MODE_LOW_ONLY);
        assert.strictEqual(timer.readByte(), 60 - 1);
        timer.setAccessMode(timer.ACCESS_MODE_HIGH_ONLY);
        assert.strictEqual(timer.readByte(), 30);
    });
});

describe("Mode 0 - Interrupt on Terminal Count", function () {
    before(function () {
        debug = chip.DebugObject();
        timer = chip.SingleTimer(debug);
    });

    afterEach(function () {
        debug.break();
    });

    after(function () {
        console.log(JSON.stringify(debug.render("Mode 0")));
    });

    it("Out becomes high after count reaches 0", function () {
        debug.test("Out high on 0");
        timer.setGate(1);
        timer.setTimerMode(0);
        timer.tick();

        assert.strictEqual(timer.getOut(), 0, "Out should go low on setting mode");

        writeCounter();
        timer.tick();

        assert.strictEqual(timer.getOut(), 0, "Out should stay low after starting counter");

        // count down to 0
        for (let i = 0; i <= count; i++) {
            assert.strictEqual(timer.getOut(), 0, "Out should stay low until count reaches 0");
            timer.tick();
        }

        assert.strictEqual(timer.getOut(), 1, "Out become high when count reaches 0");
    });

    it("Gate going low pauses counting, out stays low", function () {
        debug.test("Pause count on gate low");
        // test mode 0
        timer.setGate(1);
        timer.setTimerMode(0);
        timer.tick();

        writeCounter();
        timer.tick();
        timer.tick();

        timer.setGate(0);
        for (let i = 0; i < count; i++) {
            timer.tick();
            assert.strictEqual(timer.getOut(), 0, "Out should stay low as counting is paused");
        }

        const readCount = readCounter();
        assert.strictEqual(readCount, count, "Count should be the same as the starting value");
    });

    it("Counter wraps around and continues to count down after 0", function () {
        debug.test("Counter wraps after zero");
        timer.setGate(1);
        timer.setTimerMode(0);
        timer.tick();

        writeCounter();
        timer.tick();

        for (let i = 0; i <= count * 2; i++) {
            timer.tick();
        }

        assert.strictEqual(timer.getOut(), 1, "Out should stay high after count triggers");
        const readCount = readCounter();
        assert.strictEqual(readCount, 0x10000 - count, "Count wrap around after it reaches 0");
    });

    it("Counter is paused while new value is written", function () {
        debug.test("Counter paused on write");
        timer.setGate(1);
        timer.setTimerMode(0);

        timer.tick();
        timer.setAccessMode(timer.ACCESS_MODE_LOW_HIGH);
        timer.writeByte(count & 0xff);
        timer.tick();
        timer.writeByte((count & 0xff00) << 8);
        timer.tick();
        timer.tick();

        // low value written first, so tick would decrement but not be overwritten by second write in incorrect case
        const readCount = readCounter();
        assert.strictEqual(readCount, count, "Count should match starting value");
    });

    it("Counter value should not be effected by gate change", function () {
        debug.test("Counter continues after gate high");
        timer.setGate(1);
        timer.setTimerMode(0);

        writeCounter();
        timer.tick();
        timer.tick();

        timer.setGate(0);
        timer.tick();
        timer.setGate(1);
        timer.tick();

        // count value should have decreased by 2 from set value
        const readCount = readCounter();
        assert.strictEqual(readCount, count - 1, "Changing gate setting should only pause count");
    });
});

describe("Mode 1 - Programmable One-Shot", function () {
    before(function () {
        debug = chip.DebugObject();
        timer = chip.SingleTimer(debug);
    });

    afterEach(function () {
        debug.break();
    });

    after(function () {
        console.log(JSON.stringify(debug.render("Mode 1")));
    });

    it("The output will go low on tick flowing rising edge of gate", function () {
        debug.test("Out low on first tick");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(1);

        assert.strictEqual(timer.getOut(), 1, "Out should be high after control word written");

        // set count
        writeCounter();
        timer.tick();

        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter started");

        timer.setGate(1);
        assert.strictEqual(timer.getOut(), 1, "Out will be high until tick");
        timer.tick();
        assert.strictEqual(timer.getOut(), 0, "Out should be low after count started");
    });

    it("The output will be high after timer reaches 0", function () {
        debug.test("Out high at 0");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(1);

        // set count
        writeCounter();

        timer.setGate(1);
        timer.tick();

        for (let i = 0; i < count; i++) {
            assert.strictEqual(timer.getOut(), 0, "Out should stay low until count reaches 0");
            timer.tick();
        }

        assert.strictEqual(timer.getOut(), 1, "Out become high when count reaches 0");

        for (let i = 0; i < count / 2; i++) {
            timer.tick();
            assert.strictEqual(timer.getOut(), 1, "Out should stay high after count reaches 0");
        }
    });

    it("Counter stops once it reaches 0", function () {
        debug.test("Count stops at 0");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(1);

        // set count
        writeCounter();

        timer.setGate(1);
        timer.tick();

        for (let i = 0; i < count; i++) {
            timer.tick();
        }

        let readCount = readCounter();
        assert.strictEqual(readCount, 0, "Counter should be at 0");

        for (let i = 0; i < count / 2; i++) {
            timer.tick();
        }

        readCount = readCounter();
        assert.strictEqual(readCount, 0, "Counter should still be 0");
    });

    it("Raising gate to 1 from 0 restarts counter", function () {
        debug.test("Gate raising resets count");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(1);

        // set count
        writeCounter();
        timer.tick();

        timer.setGate(1);

        for (let i = 0; i < count; i++) {
            timer.tick();
        }

        timer.setGate(0);
        timer.tick();
        timer.setGate(1);
        timer.tick();

        const readCount = readCounter();
        assert.strictEqual(readCount, count, "Counter should be reset");
    });
});

describe("Mode 2 - Rate Generator", function () {
    before(function () {
        debug = chip.DebugObject();
        timer = chip.SingleTimer(debug);
    });

    afterEach(function () {
        debug.break();
    });

    after(function () {
        console.log(JSON.stringify(debug.render("Mode 2")));
    });

    it("The output will go high on mode set to 2 and stay high as counting starts", function () {
        debug.test("Out high on set");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(2);

        assert.strictEqual(timer.getOut(), 1, "Out should be high after control word written");

        // set count
        writeCounter();
        timer.tick();

        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");

        timer.setGate(1);
        assert.strictEqual(timer.getOut(), 1, "Out will stay high as counter starts");
        timer.tick();
        assert.strictEqual(timer.getOut(), 1, "Out will stay high while counting");
    });

    it("The output will go low for one pulse at 1 and repeats every count ticks", function () {
        debug.test("Out low pulse ever n ticks");
        timer.setGate(0);
        timer.setTimerMode(2);

        // write value and start counter
        writeCounter();
        timer.tick();
        timer.setGate(1);
        timer.tick();

        for (let j = 0; j < count / 2; j++) {
            for (let i = 1; i < count; i++) {
                assert.strictEqual(timer.getOut(), 1, "Out should stay high until count reaches 1");
                timer.tick();
            }
            assert.strictEqual(timer.getOut(), 0, "Out should be low once count reaches 1");
            timer.tick();
            assert.strictEqual(timer.getOut(), 1, "Out should stay low for one tick pulse");
        }
    });

    it("Counter value resets on gate rising value", function () {
        debug.test("Counter reset on gate rising edge");
        timer.setGate(0);
        timer.setTimerMode(2);

        // write value and start counter
        writeCounter();
        timer.tick();
        timer.setGate(1);
        timer.tick();

        let readCount = readCounter();
        assert.strictEqual(readCount, count, "Counter should be set to count after gate rising signal");
        timer.tick();

        readCount = readCounter();
        assert.strictEqual(readCount, count - 1, "Counter should be one less than count after tick");

        timer.setGate(0);
        timer.tick();
        timer.setGate(1);
        timer.tick();
        readCount = readCounter();
        assert.strictEqual(readCount, count, "Counter should be set to count after gate rising signal");
    });

    it("Out value goes high on gate going low (if value was low)", function () {
        debug.test("Out high on gate low");
        timer.setGate(0);
        timer.setTimerMode(2);

        // write value and start counter
        writeCounter();
        timer.tick();
        timer.setGate(1);
        timer.tick();

        for (let i = 1; i < count; i++) {
            timer.tick();
        }
        assert.strictEqual(timer.getOut(), 0, "Out should be low once count reaches 1");
        timer.setGate(0);
        timer.tick();
        assert.strictEqual(timer.getOut(), 1, "Out should go high on rising edge of gate");
    });

    it("Gate going low pauses counting, out is high", function () {
        debug.test("Pause on gate low");
        // test mode 0
        timer.setGate(0);
        timer.setTimerMode(2);

        writeCounter();
        timer.tick();

        for (let i = 0; i < count; i++) {
            timer.tick();
            assert.strictEqual(timer.getOut(), 1, "Out should be high as counting is paused");
        }
    });
});

describe("Mode 3 - Square Wave Generator", function () {
    before(function () {
        debug = chip.DebugObject();
        timer = chip.SingleTimer(debug);
    });

    afterEach(function () {
        debug.break();
    });

    after(function () {
        console.log(JSON.stringify(debug.render("Mode 3")));
    });

    it("The output will go high on mode set to 3 and stay high as counting starts", function () {
        debug.test("Out goes high on set count");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(3);

        assert.strictEqual(timer.getOut(), 1, "Out should be high after control word written");

        // set count
        writeCounter();
        timer.tick();

        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");

        timer.setGate(1);
        assert.strictEqual(timer.getOut(), 1, "Out will stay high as counter starts");
        timer.tick();
        assert.strictEqual(timer.getOut(), 1, "Out will stay high while counting");
    });

    it("First step decrements counter by 2 if even", function () {
        debug.test("Even value dec by 2");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(3);

        // set count
        writeCounter();
        timer.tick();

        timer.setGate(1);
        timer.tick(); // load value
        timer.tick(); // first decrement
        let readCount = readCounter();
        assert.strictEqual(readCount, count - 2, "Counter should be set to count after gate rising signal");
    });

    it("For even count, first loop out high, second loop out low", function () {
        debug.test("Out is high for half count");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(3);

        // set count
        writeCounter();
        timer.tick();
        timer.setGate(1);

        for (let j = 0; j < 2; j++) {
            for (let i = 0; i < count / 2; i++) {
                timer.tick();
                assert.strictEqual(timer.getOut(), 1, "Out should stay high for first half");
            }
            for (let i = 0; i < count / 2; i++) {
                timer.tick();
                assert.strictEqual(timer.getOut(), 0, "Out should stay low for second half");
            }
        }
    });

    it("For an odd count, first decrements by 1 then by 2's, second loop starts by 3, then 2's", function () {
        debug.test("First dec by 1, second by 3");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(3);

        // set count
        writeCounter(9);
        timer.tick();

        timer.setGate(1);

        for (let j = 0; j < 2; j++) {
            timer.tick(); // load value
            timer.tick(); // first decrement

            let readCount = readCounter();
            assert.strictEqual(readCount, 8, "First loop, first tick decrements by 1");

            for (let i = 0; i < 4; i++) {
                timer.tick();
            }

            assert.strictEqual(timer.getOut(), 0, "Out goes low after half the count");
            timer.tick();

            readCount = readCounter();
            assert.strictEqual(readCount, 6, "Second loop, first tick decrements by 3");
            for (let i = 0; i < 2; i++) {
                timer.tick();
            }
        }
    });
});

describe("Mode 4 - Software Triggered Strobe", function () {
    before(function () {
        debug = chip.DebugObject();
        timer = chip.SingleTimer(debug);
    });

    afterEach(function () {
        debug.break();
    });

    after(function () {
        console.log(JSON.stringify(debug.render("Mode 4")));
    });

    it("Setting mode makes out high", function () {
        debug.test("Out goes high mode set");
        // set gate low to be able to trigger count
        timer.setGate(1);
        timer.setTimerMode(4);
        timer.tick();

        assert.strictEqual(timer.getOut(), 1, "Out should be high after control word written");

        // set count
        writeCounter();
        timer.tick();

        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");
        timer.setGate(0);
        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");
        timer.tick();
        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");
        timer.setGate(1);
        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");
        timer.tick();
        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");
    });

    it("The output will be low for 1 clock at 0", function () {
        debug.test("1 clock low at count 0");
        // set gate low to be able to trigger count
        timer.setGate(1);
        timer.setTimerMode(4);
        timer.tick();

        // set count
        writeCounter();
        timer.tick();

        for (let i = 0; i <= count; i++) {
            assert.strictEqual(timer.getOut(), 1, "Out should stay high until count reaches 0");
            timer.tick();
        }

        assert.strictEqual(timer.getOut(), 0, "Out become low when count reaches 0");
        timer.tick();
        assert.strictEqual(timer.getOut(), 1, "Out returns high after 1 pulse");
    });

    it("Count pauses on gate low", function () {
        debug.test("Count pause on gate low");
        // set gate low to be able to trigger count
        timer.setGate(1);
        timer.setTimerMode(4);
        timer.tick();

        // set count
        writeCounter();
        timer.tick();
        timer.tick();

        let readCount = readCounter();
        assert.strictEqual(readCount, 4, "Value should be loaded");

        timer.setGate(0);
        timer.tick();

        readCount = readCounter();
        assert.strictEqual(readCount, 4, "Count should be paused");

        timer.setGate(1);
        timer.tick();

        readCount = readCounter();
        assert.strictEqual(readCount, 3, "Count continue on gate high");
    });

    it("New value written during counter resets on next tick", function () {
        debug.test("Count pause on gate low");
        // set gate low to be able to trigger count
        timer.setGate(1);
        timer.setTimerMode(4);

        // set count
        writeCounter();
        timer.tick();
        timer.tick();

        writeCounter();
        timer.tick();

        let readCount = readCounter();
        assert.strictEqual(readCount, 3, "Value should load after tick");

        timer.tick();

        readCount = readCounter();
        assert.strictEqual(readCount, 4, "Value should be loaded");
    });
});

describe("Mode 5 - Hardware Triggered Strobe", function () {
    before(function () {
        debug = chip.DebugObject();
        timer = chip.SingleTimer(debug);
    });

    afterEach(function () {
        debug.break();
    });

    after(function () {
        console.log(JSON.stringify(debug.render("Mode 5")));
    });

    it("Setting mode makes out high", function () {
        debug.test("Out goes high mode set");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(5);

        assert.strictEqual(timer.getOut(), 1, "Out should be high after control word written");

        // set count
        writeCounter();
        timer.tick();

        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");
        timer.setGate(1);
        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");
        timer.tick();
        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");
        timer.setGate(0);
        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");
        timer.tick();
        assert.strictEqual(timer.getOut(), 1, "Out should stay high until counter gets down to 1");
    });

    it("The output will be low for 1 clock at 0", function () {
        debug.test("1 clock low at count 0");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(5);

        // set count
        writeCounter();
        timer.tick();
        // load value start counting
        timer.setGate(1);
        timer.tick();

        for (let i = 0; i < count; i++) {
            assert.strictEqual(timer.getOut(), 1, "Out should stay high until count reaches 0");
            timer.tick();
        }

        assert.strictEqual(timer.getOut(), 0, "Out become low when count reaches 0");
        timer.tick();
        assert.strictEqual(timer.getOut(), 1, "Out returns high after 1 pulse");
    });

    it("Count continues on gate low", function () {
        debug.test("Count pause on gate low");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(5);

        // set count
        writeCounter();
        timer.tick();

        timer.setGate(1);
        timer.tick();

        let readCount = readCounter();
        assert.strictEqual(readCount, 4, "Value should be loaded");

        timer.setGate(0);
        timer.tick();

        readCount = readCounter();
        assert.strictEqual(readCount, 3, "Count should continue");

        timer.setGate(1);
        timer.tick();
        readCount = readCounter();
        assert.strictEqual(readCount, 4, "Count will reset");
    });

    it("New value written doesn't effect counter until gate high", function () {
        debug.test("New value doesn't effect count");
        // set gate low to be able to trigger count
        timer.setGate(0);
        timer.setTimerMode(5);

        // set count
        writeCounter();
        timer.tick();

        timer.setGate(1);
        timer.tick();

        writeCounter();
        timer.tick();

        let readCount = readCounter();
        assert.strictEqual(readCount, 2, "Writing value doesn't effect counter");

        timer.setGate(0);
        timer.tick();
        readCount = readCounter();
        assert.strictEqual(readCount, 1, "Writing value doesn't effect counter");

        timer.setGate(1);
        timer.tick();
        readCount = readCounter();
        assert.strictEqual(readCount, 4, "Value should be reloaded");
    });
});

describe("Combined timers in i8253", function () {
    const debug = chip.DebugObject(true);
    const debugTimer2 = chip.DebugObject();
    const pit = chip.HardwarePIT8253(global, {debug: {chip: debug, timer2: debugTimer2}}, []);

    afterEach(function () {
        debug.break();
        debugTimer2.break();
    });

    after(function () {
        console.log(JSON.stringify(debug.render("i8253")));
        console.log(JSON.stringify(debugTimer2.render("Timer 2")));
    });

    it("Read out as low", function () {
        // write to ctl timer 2 (10), write lo/hi (11), set mode 0 (000), binary (0)
        pit.handlePortWrite(0x43, 0b10110000);
        pit.tick();
        // out should be high
        let out = pit.handlePortRead(0x61);
        assert.strictEqual(out, 0b000001, "Out should go low after control written");

        // set count low byte to 4
        pit.handlePortWrite(0x42, 0x04);
        pit.tick();
        // set count high byte to 0
        pit.handlePortWrite(0x42, 0x00);
        pit.tick();

        // count down
        for (let i = 0; i <= 4; i++) {
            pit.tick();
        }
        // out goes low at end of count
        out = pit.handlePortRead(0x61);
        assert.strictEqual(out, 0b010001, "Out should go high after control written");

    });
});

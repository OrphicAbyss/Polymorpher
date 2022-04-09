"use strict";

/**
 * Bus Device - Holds the address and value being sent over the system bus.
 *
 * The system bus allows different devices to communicate. For convenience we
 * assume a 16 bit bus. This will allow simpler code for some situations.
 *
 * Sequence:
 * - Processor or Device waits for bus to be free
 * - Once free, processor or device sets the address lines (address location)
 * - Then sets the data lines (data being transfered)
 * - Devices then check if they own the address
 * - If they do then then read the data into their code
 *
 * THOUGHT: non-asm.js code to manage mapping between CPU and Hardware?
 * Lookup table mapping bus addresses to functions on hardware objects
 */
export function Bus (stdlib, foreign, heap) {
    "use asm";

    const memByte = new stdlib.Int8Array(heap);

    function write(bits, addr, data) {
        bits = bits | 0;
        addr = addr | 0;
        data = data | 0;

        switch (bits) {
            case 8:
                memByte[addr] = data & 0b11111111;
                // memByte[address + 1] = 0b00000000;
                break;
            case 16:
                memByte[addr] = data & 0b11111111;
                memByte[addr + 1] = data >> 8;
                break;
        }
    }

    function read(bits, addr) {
        bits = bits | 0;
        addr = addr | 0;

        switch (bits) {
            case 8:
                return memByte[addr] | (memByte[addr + 1] << 8) | 0;
            case 16:
                return memByte[addr] | 0;
        }
    }

    return {
        write,
        read
    };
}

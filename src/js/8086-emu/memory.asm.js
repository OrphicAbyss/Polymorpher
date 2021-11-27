"use strict";

export default function Memory (stdlib, foreign, heap) {
    "use asm";

    // use heap as a the register file, access either as 8bit or 16bit values
    const memByte = new stdlib.Uint8Array(heap);

    let offset = 0x0;

    function getSize () {
        return memByte.length | 0;
    }

    function getOffset () {
        return offset | 0;
    }

    function setOffset (offsetParam) {
        offsetParam = offsetParam | 0;

        offset = offsetParam;
    }

    function getByte (addr) {
        addr = addr | 0;

        return memByte[addr - offset] | 0;
    }

    function setByte (addr, value) {
        addr = addr | 0;
        value = value | 0;

        memByte[addr - offset] = value;
    }

    function getWord (addr) {
        addr = addr | 0;

        return memByte[addr - offset] | (memByte[addr - offset + 1] << 8) | 0;
    }

    function setWord (addr, value) {
        addr = addr | 0;
        value = value | 0;

        memByte[addr - offset] = value & 0b11111111;
        memByte[addr - offset + 1] = value >> 8;
    }

    function get(bits, addr) {
        bits = bits | 0;
        addr = addr | 0;

        switch (bits) {
            case 8:
                return getByte(addr);
            case 16:
                return getWord(addr);
            default:
                return -1;
        }
    }

    function set(bits, addr, value) {
        bits = bits | 0;
        addr = addr | 0;
        value = value | 0;

        switch (bits) {
            case 8:
                return setByte(addr, value);
            case 16:
                return setWord(addr, value);
            default:
                return -1;
        }
    }

    return {
        getSize,
        getOffset,
        setOffset,
        get,
        set,
        getByte,
        setByte,
        getWord,
        setWord
    }
}

export function MappedMemory () {
    const memoryArray = [];

    function addMemory (memory) {
        const start = memory.getOffset();
        const end = memory.getSize() + start;
        memoryArray.push({memory, start, end})
    }

    // Unknown location
    const noMemory = {
        get: () => 0,
        set: () => undefined,
        getByte: () => 0,
        getWord: () => 0,
        setByte: () => undefined,
        setWord: () => undefined
    };

    function getBuffer (loc) {
        loc = loc | 0;

        for (let i = memoryArray.length - 1; i >= 0; i--) {
            let memObj = memoryArray[i];
            if (loc >= memObj.start && loc < memObj.end) {
                return memObj.memory;
            }
        }
        return noMemory;
    }

    return {
        addMemory: addMemory,
        get: (bits, loc) => {
            return getBuffer(loc).get(bits, loc);
        },
        set: (bits, loc, value) => {
            return getBuffer(loc).set(bits, loc, value);
        },
        getByte: (loc) => {
            return getBuffer(loc).getByte(loc);
        },
        setByte: (loc, value) => {
            return getBuffer(loc).setByte(loc, value);
        },
        getWord: (loc) => {
            return getBuffer(loc).getWord(loc);
        },
        setWord: (loc, value) => {
            return getBuffer(loc).setWord(loc, value);
        }
    }
}

"use strict";

/**
 * Holds the register values and allows for getting/setting values
 *
 * @param stdlib
 * @param foreign
 * @param heap
 * @constructor
 */
function Registers(stdlib, foreign, heap) {
    "use asm";

    // use heap as a the register file, access either as 8bit or 16bit values
    const registerFile8Bit =  new stdlib.Uint8Array(heap);

    // register file layout matches bit codes of registers
    // General 8 bit
    const AL = 0b000;
    const CL = 0b001;
    const DL = 0b010;
    const BL = 0b011;
    const AH = 0b100;
    const CH = 0b101;
    const DH = 0b110;
    const BH = 0b111;
    // General 16 bit
    const AX = 0b000;
    const CX = 0b001;
    const DX = 0b010;
    const BX = 0b011;
    const SP = 0b100;
    const BP = 0b101;
    const SI = 0b110;
    const DI = 0b111;
    // Stack Registers are offset in reg file
    const stackOffset = 0b1000;
    const ES = 0b000;
    const CS = 0b001;
    const SS = 0b010;
    const DS = 0b011;
    // Instruction Pointer - set to _reset vector_ for boot
    const IP = 0b1100;
    // Flags
    const Set= 0b1111000000000010;
    const flags = 0b1101;

    const CF = 0b0000000000000001;     // bit 0: Carry flag
    const R1 = 0b0000000000000010;     // bit 1: reserved, always set
    const PF = 0b0000000000000100;     // bit 2: Parity flag
    const R2 = 0b0000000000001000;     // bit 3: reserved, always clear
    const AF = 0b0000000000010000;     // bit 4: Auxiliary Carry flag (aka Arithmetic flag)
    const R3 = 0b0000000000100000;     // bit 5: reserved, always clear
    const ZF = 0b0000000001000000;     // bit 6: Zero flag
    const SF = 0b0000000010000000;     // bit 7: Sign flag
    const TF = 0b0000000100000000;     // bit 8: Trap flag
    const IF = 0b0000001000000000;     // bit 9: Interrupt flag
    const DF = 0b0000010000000000;     // bit 10: Direction flag
    const OF = 0b0000100000000000;     // bit 11: Overflow flag
    const I1 = 0b0001000000000000;     // bits 12-13: I/O Privilege Level (always set on 8086/80186; clear on 80286 reset)
    const I2 = 0b0010000000000000;     // bits 12-13: I/O Privilege Level (always set on 8086/80186; clear on 80286 reset)0000_
    const NT = 0b0100000000000000;     // bit 14: Nested Task flag (always set on 8086/80186; clear on 80286 reset)
    const R4 = 0b1000000000000000;     // bit 15: reserved (always set on 8086/80186; clear otherwise)
    const All= 0b1111111111111111;


    function getGeneral8Bit (bitCode) {
        bitCode = bitCode | 0;

        const high = (bitCode & 0b100) >> 2;
        const low = (bitCode & 0b011) << 1;

        bitCode = high | low;

        return registerFile8Bit[bitCode] | 0;
    }

    function setGeneral8Bit (bitCode, number) {
        bitCode = bitCode | 0;
        number = number | 0;

        const high = (bitCode & 0b100) >> 2;
        const low = (bitCode & 0b011) << 1;

        bitCode = high | low;

        registerFile8Bit[bitCode] = number;
    }

    function getGeneral16Bit (bitCode) {
        bitCode = bitCode | 0;

        bitCode = bitCode << 1; // Ensure 16bit between addresses

        // return registerFile16Bit[bitCode] | 0;
        return registerFile8Bit[bitCode] | (registerFile8Bit[bitCode + 1] << 8) | 0;
    }

    function setGeneral16Bit (bitCode, number) {
        bitCode = bitCode | 0;
        number = number | 0;

        bitCode = bitCode << 1; // Ensure 16bit between addresses

        // registerFile16Bit[bitCode] = number;
        registerFile8Bit[bitCode] = number & 0b11111111;
        registerFile8Bit[bitCode + 1] = number >> 8 & 0b11111111;
    }

    function getSegment16Bit (bitCode) {
        bitCode = bitCode | 0;

        bitCode = stackOffset | bitCode;

        return getGeneral16Bit(bitCode) | 0;
    }

    function setSegment16Bit (bitCode, number) {
        bitCode = bitCode | 0;
        number = number | 0;

        bitCode = stackOffset | bitCode;

        setGeneral16Bit(bitCode, number);
    }

    function getInstructionPointer () {
        return getGeneral16Bit(IP) | 0;
    }

    function setInstructionPointer (offset) {
        offset = offset | 0;

        setGeneral16Bit(IP, offset);
    }

    function incInstructionPointer (bytes) {
        bytes = bytes | 0;

        const value = getInstructionPointer();
        setInstructionPointer(value + bytes);
    }

    function getInstructionLocation () {
        return (getSegment16Bit(CS) * 16 + getInstructionPointer()) | 0;
    }

    function getFlags () {
        return getGeneral16Bit(flags);
    }

    function setFlags (val) {
        val = val | 0;

        setGeneral16Bit(flags, val | Set);
    }

    function isFlagSet (flag) {
        return (flags & flag) !== 0;
    }

    function clearInterruptFlag () {
        const value = getFlags() | 0;

        setFlags(value & (All ^ IF));
    }

    function setInterruptFlag () {
        const value = getFlags() | 0;

        setFlags(value | IF);
    }

    function clearCarryFlag () {
        const value = getFlags() | 0;

        setFlags(value & (All ^ CF));
    }

    function setCarryFlag () {
        const value = getFlags() | 0;

        setFlags(value | CF);
    }

    function clearDirectionFlag () {
        const value = getFlags() | 0;

        setFlags(value & (All ^ DF));
    }

    function setDirectionFlag () {
        const value = getFlags() | 0;

        setFlags(value | DF);
    }

    function lookup8bit(bitCode) {
        bitCode = bitCode | 0;

        switch (bitCode) {
            case AL:
                return "AL";
            case CL:
                return "CL";
            case DL:
                return "DL";
            case BL:
                return "BL";
            case AH:
                return "AH";
            case CH:
                return "CH";
            case DH:
                return "DH";
            case BH:
                return "BH";
            default:
                return "xx";
        }
    }

    function lookup16bit(bitCode) {
        bitCode = bitCode | 0;

        switch (bitCode) {
            case AX:
                return "AX";
            case CX:
                return "CX";
            case DX:
                return "DX";
            case BX:
                return "BX";
            case SP:
                return "SP";
            case BP:
                return "BP";
            case SI:
                return "SI";
            case DI:
                return "DI";
            default:
                return "XX";
        }
    }

    function lookup(bits, bitCode) {
        bits = bits | 0;
        bitCode = bitCode | 0;

        switch (bits) {
            case 8:
                return lookup8bit(bitCode);
            case 16:
                return lookup16bit(bitCode);
            default:
                return "ZZ";
        }
    }

    function getGeneral(bits, bitCode) {
        bits = bits | 0;
        bitCode = bitCode | 0;

        switch (bits) {
            case 8:
                return getGeneral8Bit(bitCode);
            case 16:
                return getGeneral16Bit(bitCode);
            default:
                return -1;
        }
    }

    function setGeneral(bits, bitCode, number) {
        bits = bits | 0;
        bitCode = bitCode | 0;

        switch (bits) {
            case 8:
                return setGeneral8Bit(bitCode, number);
            case 16:
                return setGeneral16Bit(bitCode, number);
            default:
                return -1;
        }
    }

    // Initialise flags
    setFlags(Set);

    return {
        getGeneral,
        setGeneral,
        getGeneral8Bit,
        setGeneral8Bit,
        getGeneral16Bit,
        setGeneral16Bit,
        getSegment16Bit,
        setSegment16Bit,
        getFlags,
        setFlags,
        isFlagSet,
        clearInterruptFlag,
        setInterruptFlag,
        clearCarryFlag,
        setCarryFlag,
        clearDirectionFlag,
        setDirectionFlag,
        getInstructionPointer,
        setInstructionPointer,
        incInstructionPointer,
        getInstructionLocation,
        lookup,
        reg8: {
            AL, CL, DL, BL,
            AH, CH, DH, BH,
            lookup: lookup8bit
        },
        reg16: {
            AX, CX, DX, BX,
            SP, BP, SI, DI,
            lookup: lookup16bit
        },
        seg16: {
            ES, CS, SS, DS,
            lookup: (bit) => {
                bit = bit | 0;

                switch (bit) {
                    case ES:
                        return "ES";
                    case CS:
                        return "CS";
                    case SS:
                        return "SS";
                    case DS:
                        return "DS";
                    default:
                        return "XX";
                }
            }
        },
        flags: {
            CF, PF, AF, ZF, SF, TF, IF, DF, OF, All
        }
    };
}

export default Registers;

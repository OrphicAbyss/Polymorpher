"use strict";

/**
 * Javascript based 8086 emulator
 *
 * *Design*
 * Components made out of ASM.js based code and joined together by an orchestration manager.
 */


// import {Register, registers} from "../register";

const numToHex = (num) => num.toString(16).toUpperCase();

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
    const registerFile16Bit = new stdlib.Uint16Array(heap);
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

        return registerFile16Bit[bitCode] | 0;
    }

    function setGeneral16Bit (bitCode, number) {
        bitCode = bitCode | 0;
        number = number | 0;

        bitCode = bitCode << 1; // Ensure 16bit between addresses

        registerFile16Bit[bitCode] = number;
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

    // Initialise flags
    setFlags(Set);

    return {
        getGeneral8Bit,
        setGeneral8Bit,
        getGeneral16Bit,
        setGeneral16Bit,
        getSegment16Bit,
        setSegment16Bit,
        getFlags,
        setFlags,
        clearInterruptFlag,
        setInterruptFlag,
        clearCarryFlag,
        setCarryFlag,
        getInstructionPointer,
        setInstructionPointer,
        incInstructionPointer,
        getInstructionLocation,
        reg8: {
            AL, CL, DL, BL,
            AH, CH, DH, BH,
            lookup: (bit) => {
                bit = bit | 0;

                switch (bit) {
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
        },
        reg16: {
            AX, CX, DX, BX,
            SP, BP, SI, DI,
            lookup: (bit) => {
                bit = bit | 0;

                switch (bit) {
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

// TODO: handle memory mapped hardware (BIOS, Video data etc)
function Memory (stdlib, foreign, heap) {
    "use asm";

    // use heap as a the register file, access either as 8bit or 16bit values
    const memByte = new stdlib.Uint8Array(heap);
    const memWord = new stdlib.Uint16Array(heap);

    var offset = 0x0;

    function setOffset (offsetPrarm) {
        offsetPrarm = offsetPrarm | 0;

        offset = offsetPrarm;
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

        return memWord[addr - offset] | 0;
    }

    function setWord (addr, value) {
        addr = addr | 0;
        value = value | 0;

        memWord[addr - offset] = value | 0;
    }

    return {
        setOffset,
        getByte,
        setByte,
        getWord,
        setWord
    }
}

function Instructions (stdlib, foreign, heap) {
    "use asm";

    function getModRM(insLoc) {
        insLoc = insLoc | 0;

        return foreign.memory.getByte(insLoc) | 0;
    }

    function getImm(insLoc, bits) {
        insLoc = insLoc | 0;
        bits = bits | 0;

        switch (bits) {
            case 8:
                return foreign.memory.getByte(insLoc) | 0;
            case 16:
                return foreign.memory.getWord(insLoc) | 0;
        }
    }

    function getRel(insLoc, bits) {
        insLoc = insLoc | 0;
        bits = bits | 0;

        const sign8bit = 0b10000000;
        const full8Bit = 0b11111111;
        const sign16bit = 0b1000000000000000;
        const full16bit = 0b1111111111111111;
        const rel = getImm(insLoc, bits) | 0;

        if (bits === 8 && (rel & sign8bit) > 0) {
            return ~rel ^ full8Bit;
        } else if (bits === 16 && (rel & sign16bit) > 0) {
            // negative number
            return ~rel ^ full16bit;
        }
        return rel | 0;
    }

    function flagJmp (insLoc, flag, cmp) {
        insLoc = insLoc | 0;
        flag = flag | 0;
        cmp = cmp | 0;

        const flags = foreign.registers.getFlags() | 0;
        const offset = getRel(insLoc + 1, 8) | 0;

        if ((flags & flag) === cmp) {
            // move to new location
            foreign.registers.incInstructionPointer(offset);
        }

        return offset | 0;
    }

    function setFlagsCOPSZ (previous, result, carry) {
        previous = previous | 0;
        result = result | 0;
        carry = carry | 0;

        const flags = foreign.registers.flags;
        let flagState = foreign.registers.getFlags();

        let clearFlags = flags.All;
        let setFlags = 0;

        if (carry === 0) {
            clearFlags = clearFlags ^ flags.CF;
        } else {
            setFlags = setFlags | flags.CF;
        }

        if ((previous & 0b10000000) === (result & 0b10000000)) {
            clearFlags = clearFlags ^ flags.OF;
        } else {
            setFlags = setFlags | flags.OF;
        }

        if ((result & 0b10000000) !== 0) {
            clearFlags = clearFlags ^ flags.SF;
        } else {
            setFlags = setFlags | flags.SF;
        }

        if (result === 0) {
            clearFlags = clearFlags ^ flags.ZF;
        } else {
            setFlags = setFlags | flags.ZF;
        }

        let parity = 0;
        let test = result & 0b11111111;
        parity = test & 0b1 + test >> 1 & 0b1 + test >> 2 & 0b1 + test >> 3 & 0b1 + test >> 4 & 0b1
            + test >> 5 & 0b1 + test >> 6 & 0b1 + test >> 7 & 0b1;

        if (parity % 2 === 1) {
            clearFlags = clearFlags ^ flags.PF;
        } else {
            setFlags = setFlags | flags.PF;
        }

        flagState = flagState & clearFlags | setFlags;
        foreign.registers.setFlags(flagState);
    }

    /**
     * Clears OF, CF
     * Sets SF, ZF, PF depending
     */
    function setFlags (result) {
        result = result | 0;

        const flags = foreign.registers.flags;
        let flagState = foreign.registers.getFlags();

        let clearFlags = flags.All ^ flags.OF ^ flags.CF;
        let setFlags = 0;

        if ((result & 0b10000000) !== 0) {
            clearFlags = clearFlags ^ flags.SF;
        } else {
            setFlags = setFlags | flags.SF;
        }

        if (result !== 0) {
            clearFlags = clearFlags ^ flags.ZF;
        } else {
            setFlags = setFlags | flags.ZF;
        }

        let parity = 0;
        let test = result & 0b11111111;
        parity = test & 0b1 + test >> 1 & 0b1 + test >> 2 & 0b1 + test >> 3 & 0b1 + test >> 4 & 0b1
            + test >> 5 & 0b1 + test >> 6 & 0b1 + test >> 7 & 0b1;

        if (parity % 2 === 1) {
            clearFlags = clearFlags ^ flags.PF;
        } else {
            setFlags = setFlags | flags.PF;
        }

        flagState = flagState & clearFlags | setFlags;
        foreign.registers.setFlags(flagState);
    }

    function execute() {
        const insLoc = foreign.registers.getInstructionLocation() | 0;
        const opCode = foreign.memory.getByte(insLoc) | 0;
        let opCodeBytes = 1;

        switch (opCode) {
            // ADD
            case 0x00:
                // Add r/m8, r8
                getModRM(insLoc + 1);
                opCodeBytes += 2;

                break;
            case 0x01:
                // Add r/m16, r16
                break;
            case 0x02:
                // Add r8, r/m8
                break;
            case 0x03:
                // Add r16, r/m16
                break;
            case 0x04:
                // Add AL, d8
                getImm(insLoc + 1, 8);

                break;
            case 0x05:
                // Add AX, d16
                getImm(insLoc + 1, 16);

                break;

            // OR
            case 0x08:
                // Or r/m8, r8
                break;
            case 0x09:
                // Or r/m16, r16
                break;
            case 0x0A:
                // Or r8, r/m8
                break;
            case 0x0B:
                // Or r16, r/m16
                break;
            case 0x0C:
                // Or AL, d8
                break;
            case 0x0D:
                // Or AX, d16
                break;

            case 0x06:
                // Push ES
                break;
            case 0x07:
                // Pop ES
                break;

            case 0x0E:
                // Push CS
                break;
            case 0x0F:
                // Pop CS
                break;

            // ADC
            case 0x10:
                // Adc r/m8, r8
                break;
            case 0x11:
                // Adc r/m16, r16
                break;
            case 0x12:
                // Adc r8, r/m8
                break;
            case 0x13:
                // Adc r16, r/m16
                break;
            case 0x14:
                // Adc AL, d8
                break;
            case 0x15:
                // Adc AX, d16
                break;

            // SBB
            case 0x18:
                // Sbb r/m8, r8
                break;
            case 0x19:
                // Sbb r/m16, r16
                break;
            case 0x1A:
                // Sbb r8, r/m8
                break;
            case 0x1B:
                // Sbb r16, r/m16
                break;
            case 0x1C:
                // Sbb AL, d8
                break;
            case 0x1D:
                // Sbb AX, d16
                break;

            case 0x16:
                // Push SS
                break;
            case 0x17:
                // Pop SS
                break;

            case 0x1E:
                // Push DS
                break;
            case 0x1F:
                // Pop DS
                break;

            case 0x30:
                // XOR r/m8, r8
            case 0x32: {
                // XOR r8, r/m8
                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const reg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                const memRegName = foreign.registers.reg8.lookup(memReg);
                const regName = foreign.registers.reg8.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, modRM, regName, memRegName, "Memory lookup not supported");
                    return;
                }

                const memRegValue = foreign.registers.getGeneral8Bit(memReg);
                const regValue = foreign.registers.getGeneral8Bit(reg);

                const result = memRegValue ^ regValue;
                setFlags(result);

                if (opCode === 0x30) {
                    foreign.registers.setGeneral8Bit(memReg, result);
                    foreign.log("XOR ", memRegName, ", ", regName);
                } else if (opCode === 0x32) {
                    foreign.registers.setGeneral8Bit(reg, result);
                    foreign.log("XOR ", regName, ", ", memRegName);
                } else {
                    foreign.error("Invalid opcode being handled by 30/32 handler: ", opCode);
                }

                break;
            }

            case 0x31:
                // XOR r/m16, r16
            case 0x33: {
                // XOR r16, r/m16
                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const reg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                const memRegName = foreign.registers.reg16.lookup(memReg);
                const regName = foreign.registers.reg16.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, modRM, regName, memRegName, "Memory lookup not supported");
                    return;
                }

                const memRegValue = foreign.registers.getGeneral16Bit(memReg);
                const regValue = foreign.registers.getGeneral16Bit(reg);

                const result = memRegValue ^ regValue;
                setFlags(result);

                if (opCode === 0x31) {
                    foreign.registers.setGeneral16Bit(memReg, result);
                    foreign.log("XOR ", memRegName, ", ", regName);
                } else if (opCode === 0x33) {
                    foreign.registers.setGeneral16Bit(reg, result);
                    foreign.log("XOR ", regName, ", ", memRegName);
                } else {
                    foreign.error("Invalid opcode being handled by 30/32 handler: ", opCode);
                }

                break;
            }


            case 0x70:{
                // JO
                const OF = foreign.registers.flags.OF;
                const offset = flagJmp(insLoc, OF, OF);
                opCodeBytes += 1;

                foreign.log("JO ", offset);
                break;
            }
            case 0x71: {
                // JNO
                const OF = foreign.registers.flags.OF;
                const offset = flagJmp(insLoc, OF, 0);
                opCodeBytes += 1;

                foreign.log("JNO ", offset);
                break;
            }
            case 0x72: {
                // JC, JB, JNAE
                const CF = foreign.registers.flags.CF;
                const offset = flagJmp(insLoc, CF, CF);
                opCodeBytes += 1;

                foreign.log("JC/JB/JNAE ", offset);
                break;
            }
            case 0x73: {
                // JNC, JNB, JAE
                const CF = foreign.registers.flags.CF;
                const offset = flagJmp(insLoc, CF, 0);
                opCodeBytes += 1;

                foreign.log("JNC/JNB/JAE ", offset);
                break;
            }
            case 0x74: {
                // JE, JZ
                const ZF = foreign.registers.flags.ZF;
                const offset = flagJmp(insLoc, ZF, ZF);
                opCodeBytes += 1;

                foreign.log("JZ/JE ", offset);
                break;
            }
            case 0x75: {
                // JNE, JNZ
                const ZF = foreign.registers.flags.ZF;
                const offset = flagJmp(insLoc, ZF, 0);
                opCodeBytes += 1;

                foreign.log("JNZ/JNE ", offset);
                break;
            }
            case 0x76: {
                // JBE, JNA
                const flags = foreign.registers.flags.CF | foreign.registers.flags.ZF;
                const offset = flagJmp(insLoc, flags, flags);
                opCodeBytes += 1;

                foreign.log("JBE/JNA ", offset);
                break;
            }
            case 0x77: {
                // JNBE, JA
                const flags = foreign.registers.flags.CF | foreign.registers.flags.ZF;
                const offset = flagJmp(insLoc, flags, 0);
                opCodeBytes += 1;

                foreign.log("JNBE/JA ", offset);
                break;
            }
            case 0x78: {
                // JS
                const SF = foreign.registers.flags.SF;
                const offset = flagJmp(insLoc, SF, SF);
                opCodeBytes += 1;

                foreign.log("JS ", offset);
                break;
            }
            case 0x79: {
                // JNS
                const SF = foreign.registers.flags.SF;
                const offset = flagJmp(insLoc, SF, 0);
                opCodeBytes += 1;

                foreign.log("JNS ", offset);
                break;
            }
            case 0x7A: {
                // JP/JPE
                const PF = foreign.registers.flags.PF;
                const offset = flagJmp(insLoc, PF, PF);
                opCodeBytes += 1;

                foreign.log("JP/JPE ", offset);
                break;
            }
            case 0x7B: {
                // JNP/ JPO
                const PF = foreign.registers.flags.PF;
                const offset = flagJmp(insLoc, PF, 0);
                opCodeBytes += 1;

                foreign.log("JNP/JPO ", offset);
                break;
            }

            case 0x88:
                // MOV r/m8, r8
            case 0x8A: {
                // MOV r8, r/m8

                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const reg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                const memRegName = foreign.registers.reg8.lookup(memReg);
                const regName = foreign.registers.reg8.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, " ", modRM, " ", regName, " ", memRegName, " Memory lookup not supported");
                    return;
                }

                if (opCode === 0x88) {
                    const regValue = foreign.registers.getGeneral8Bit(reg);
                    foreign.registers.setGeneral8Bit(memReg, regValue);

                    foreign.log("MOV ", memRegName, ", ", regName);
                } else if (opCode === 0x8A) {
                    const memRegValue = foreign.registers.getGeneral8Bit(memReg);
                    foreign.registers.setGeneral8Bit(reg, memRegValue);

                    foreign.log("MOV ", regName, ", ", memRegName);
                } else {
                    foreign.error("Invalid opcode being handled by 88/8A handler: ", opCode);
                }

                break;
            }

            case 0x89:
                // MOV r/m16, r16
            case 0x8B: {
                // MOV r16, r/m16

                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const reg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                const memRegName = foreign.registers.reg16.lookup(memReg);
                const regName = foreign.registers.reg16.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, " ", modRM, " ", regName, " ", memRegName, " Memory lookup not supported");
                    return;
                }

                if (opCode === 0x89) {
                    const regValue = foreign.registers.getGeneral16Bit(reg);
                    foreign.registers.setGeneral16Bit(memReg, regValue);

                    foreign.log("MOV ", memRegName, ", ", regName);
                } else if (opCode === 0x8B) {
                    const memRegValue = foreign.registers.getGeneral16Bit(memReg);
                    foreign.registers.setGeneral16Bit(reg, memRegValue);

                    foreign.log("MOV ", regName, ", ", memRegName);
                } else {
                    foreign.error("Invalid opcode being handled by 89/8B handler: ", opCode);
                }

                break;
            }
            case 0x8C:
                // MOV r/m16, Sreg
            case 0x8E: {
                // MOV Sreg, r/m16
                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const segReg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                const memRegName = foreign.registers.reg16.lookup(memReg);
                const segRegName = foreign.registers.seg16.lookup(segReg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, " ", modRM, " ", segRegName, " ", memRegName, " Memory lookup not supported");
                    return;
                }

                if (opCode === 0x8C) {
                    const segRegValue = foreign.registers.getSegment16Bit(segReg);
                    foreign.registers.setGeneral16Bit(memReg, segRegValue);

                    foreign.log("MOV ", memRegName, ", ", segRegName);
                } else if (opCode === 0x8E) {
                    const memRegValue = foreign.registers.getGeneral16Bit(memReg);
                    foreign.registers.setSegment16Bit(segReg, memRegValue);

                    foreign.log("MOV ", segRegName, ", ", memRegName);
                } else {
                    foreign.error("Invalid opcode being handled by 8C/8E handler: ", opCode);
                }
                break;
            }

            case 0x9E: {
                // SAHF

                // get AH value
                const AH = foreign.registers.getGeneral8Bit(foreign.registers.reg8.AH) | 0;
                // get flags that they will be combined with (high part of value)
                const flags = foreign.registers.getFlags() & 0b1111111100000000;

                // Ensure always off and always on values are correct and combine with high part of flags
                const result = AH & 0b11010101 | flags;

                foreign.registers.setFlags(result);

                foreign.log("SAHF (", AH.toString(2), ")");
                break;
            }
            case 0x9F: {
                // LAHF
                const flags = foreign.registers.getFlags() & 0b11111111;
                foreign.registers.setGeneral8Bit(foreign.registers.reg8.AH, flags);

                foreign.log("LAHF (", flags.toString(2), ")");
                break;
            }

            case 0xB0:
            case 0xB1:
            case 0xB2:
            case 0xB3:
            case 0xB4:
            case 0xB5:
            case 0xB6:
            case 0xB7: {
                // MOV (AL|CL|DL|...), imm8
                const imm = getImm(insLoc + 1, 8);
                opCodeBytes += 1;

                const reg = opCode & 0b0111;
                foreign.registers.setGeneral8Bit(reg, imm);

                const regStr = foreign.registers.reg8.lookup(reg);
                foreign.log("MOV ", regStr, ", ", imm);
                break;
            }

            case 0xB8:
            case 0xB9:
            case 0xBA:
            case 0xBB:
            case 0xBC:
            case 0xBD:
            case 0xBE:
            case 0xBF: {
                // MOV (AX|CX|DX|...), imm16
                const imm = getImm(insLoc + 1, 16);
                opCodeBytes += 2;

                const reg = opCode & 0b0111;
                foreign.registers.setGeneral16Bit(reg, imm);

                const regStr = foreign.registers.reg16.lookup(reg);
                foreign.log("MOV ", regStr, ", ", imm);
                break;
            }

            case 0xD0:{
                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const subOpCode = modRM & 0b00111000;
                const reg = modRM & 0b00000111;
                const regName = foreign.registers.reg8.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, modRM, regName, "Memory lookup not supported");
                    return;
                }

                const regValue = foreign.registers.getGeneral8Bit(reg);
                const shifterValue = 1;

                switch (subOpCode) {
                    case 0x00:
                        foreign.error("ROL  ", regName, ", 1");
                        break;
                    case 0x08:
                        foreign.error("ROR ", regName, ", 1");
                        break;
                    case 0x10:
                        foreign.error("RCL ", regName, ", 1");
                        break;
                    case 0x18:
                        foreign.error("RCR ", regName, ", 1");
                        break;
                    case 0x20:
                        const output = regValue << shifterValue;
                        const carry = output & 0b100000000 > 8;

                        foreign.registers.setGeneral8Bit(reg, output);
                        setFlagsCOPSZ(regValue, output, carry);

                        foreign.log("SHL ", regName, ", 1");
                        break;
                    case 0x28:
                        foreign.error("SHR ", regName, ", 1");
                        break;
                    case 0x30:
                        foreign.error("SAL ", regName, ", 1");
                        break;
                    case 0x38:
                        foreign.error("SAR ", regName, ", 1");
                        break;
                }
                break;
            }
            case 0xD2:{
                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const subOpCode = modRM & 0b00111000;
                const reg = modRM & 0b00000111;
                const regName = foreign.registers.reg8.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, modRM, regName, "Memory lookup not supported");
                    return;
                }

                const regValue = foreign.registers.getGeneral8Bit(reg);
                const shifterValue = foreign.registers.getGeneral8Bit(foreign.registers.reg8.CL);

                switch (subOpCode) {
                    case 0x00:
                        foreign.error("ROL ", regName, ", CL");
                        break;
                    case 0x08:
                        foreign.error("ROR ", regName, ", CL");
                        break;
                    case 0x10:
                        foreign.error("RCL ", regName, ", CL");
                        break;
                    case 0x18:
                        foreign.error("RCR ", regName, ", CL");
                        break;
                    case 0x20: {
                        const output = regValue << shifterValue;

                        foreign.registers.setGeneral8Bit(reg, output);
                        setFlagsCOPSZ(regValue, output);

                        foreign.log("SHL ", regName, ", CL");
                        break;
                    }
                    case 0x28: {
                        const output = regValue >> shifterValue;
                        const carry = ((1 << shifterValue - 1) & regValue) >> (shifterValue - 1);

                        foreign.registers.setGeneral8Bit(reg, output);
                        setFlagsCOPSZ(regValue, output, carry);

                        foreign.log("SHR ", regName, ", CL");
                        break;
                    }
                    case 0x30:
                        foreign.error("SAL ", regName, ", CL");
                        break;
                    case 0x38:
                        foreign.error("SAR ", regName, ", CL");
                        break;
                }
                break;
            }

            case 0xEB: {
                // JMP
                const offset = getRel(insLoc + 1, 8);
                opCodeBytes += 1;
                // move to new location
                foreign.registers.incInstructionPointer(offset);

                foreign.log("JMP ", offset);
                break;
            }

            case 0xFA:
                // CLI
                foreign.registers.clearInterruptFlag();

                foreign.log("CLI");
                break;

            case 0xF4:
                // keep the IP constant
                opCodeBytes = 0;
                foreign.error("HLT");
                break;

            case 0xF8:
                // CLC
                foreign.registers.clearCarryFlag();

                foreign.log("CLC");
                break;
            case 0xF9:
                // STC
                foreign.registers.setCarryFlag();

                foreign.log("STC");
                break;

            default:
                // Assume one byte instruction
                foreign.error(insLoc.toString(16), " : ", opCode.toString(16), " : ", "Unknown instruction");
                break;
        }

        foreign.registers.incInstructionPointer(opCodeBytes);
    }

    return {
        execute: execute
    };
}

// THOUGHT: non-asm.js code to manage mapping between CPU and Hardware?
// Lookup table mapping bus addresses to functions on hardware objects
function Bus (stdlib, foreign, heap) {
    "use asm";

    const memByte = new stdlib.Int8Array(heap);
    const memWord = new stdlib.Int16Array(heap);

    function write(bits, address, data) {
        bits = bits | 0;
        address = address | 0;
        data = data | 0;


    }

    function read(bits, address) {
        bits = bits | 0;
        address = address | 0;


    }

    return {};
}

export function Test (biosBinary) {
    // Heap for registers
    const registerData = new ArrayBuffer(64);
    // Heap for main memory
    const memoryData = new ArrayBuffer(Math.pow(2, 18));
    // Heap for memory mapped bios data
    const biosData = Uint8Array.from(biosBinary);

    const registers = new Registers(window, {}, registerData);
    const memory = new Memory(window, {}, memoryData);
    const bios = new Memory(window, {}, biosData);
    bios.setOffset(0xF0000);

    registers.setInstructionPointer(0x0000);
    registers.setSegment16Bit(registers.seg16.CS, 0xF000);

    function MappedMemory() {
        // Unknown location
        const noMemory = {
            getByte: () => 0,
            getWord: () => 0,
            setByte: () => undefined,
            setWord: () => undefined
        };

        function getBuffer (loc) {
            loc = loc | 0;
            if (loc < memoryData.length) {
                // is part of the main memory
                return memory;
            } else if (loc >= 0xF0000 && loc < 0x100000) {
                // is part of the bios mapped memory
                return bios;
            } else {
                console.log("Unknown memory access at: " + loc.toString(16))
                return noMemory;
            }
        }

        return {
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

    const logs = [];
    const errors = [];
    const addLog = (...log) => logs.push(log.join(""));
    const addError = (...err) => errors.push(err.join(""));
    let steps = 0;

    const mappedMemory = new MappedMemory();
    const cpu = new Instructions(window, {registers, memory: mappedMemory, log: addLog, error: addError}, null);

    const logPosAndCode = () => {
        const IP = registers.getInstructionLocation();
        addLog(`0:${numToHex(IP)} Op ${numToHex(mappedMemory.getByte(IP))}`);
    }
    while (errors.length === 0 && steps < 100) {
        // logPosAndCode();
        cpu.execute();
        steps++;
    }
    // logPosAndCode();
    // console.log(errors[0]);

    return {
        logs,
        errors,
        registers
    };
}


//
// Initial 8254 superset of the 8253 and has a higher clock speed ratings
//
//
//



/**
 * Intel 8253 & 8254 - Programmable Interrupt Timers used by early x86 computers
 *
 * They have 3 timers per chip and have 6 different modes for each timer.
 *
 * Historically Chip 1 manages the following
 * 0. Interrupt timer for time measurements in OS
 * 1. Timer for refreshing DRAM
 * 2. Timer for playing sounds on the PC speaker
 *
 * Mode 0 (000): Interrupt on terminal count
 * Mode 1 (001): programmable one shot
 * Mode 2 (X10): rate generator
 * Mode 3 (X11): square wave generator
 * Mode 4 (100): Software Triggered Strobe
 * Mode 5 (101): Hardware Triggered Strobe
 *
 * Timer 1 - 18.2 hz (configurable)
 * 1. OS sets value (FFFFh) of timer on the chip
 * 2. Timer counts down to 0
 * 3. Timer sends interrupt
 * 4. OS response to interrupt
 * 5. OS increments data at 0040:006c
 * 6. Start step 1 again
 */
function HardwarePIT8254 () {



    // Chip 1
    // PORT 0x40 -
    // PORT 0x41 -
    // PORT 0x42 -
    // PORT 0x43 -
    // Chip 2 - Not on 8086/88
    // PORT 0x50 -
    // PORT 0x51 -
    // PORT 0x52 -
    // PORT 0x53 -
}

/**
 * Intel 8259 - Programmable Interrupt Controller used by x86 computers
 *
 * IBM XT and compatible machines (8088 & 8086) used a single chip.
 * IBM AT and compatible machines (286 & up) used dual chips with one as a slave to the other.
 *
 *
 */
function HardwarePIC8259 () {
    // Programmable Interrupt Controller
    //

    // PORT 0x20 - CMD
    // PORT 0x21 - Data
}

function HardwarePIT8253 () {

}

// SETUP CPU
// const memoryData = new ArrayBuffer(1048576);
// const registersData = new ArrayBuffer(32);
//
// const memory = new Memory(window, null, memoryData);
// const register = new Register(window, null, registersData);
// const foreignCalls = {
//     getInstructionLocation: register.getInstructionLocation,
//     getByte: memory.getByte
// }
//
// const cpu = new Instructions(window, foreignCalls);




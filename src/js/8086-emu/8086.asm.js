"use strict";

/**
 * Javascript based 8086 emulator
 *
 * *Design*
 * Components made out of ASM.js based code and joined together by an orchestration manager.
 */


import Registers from "./8086.registers.asm";

// TODO: handle memory mapped hardware (BIOS, Video data etc)
function Memory (stdlib, foreign, heap) {
    "use asm";

    // use heap as a the register file, access either as 8bit or 16bit values
    const memByte = new stdlib.Uint8Array(heap);

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
        setOffset,
        get,
        set,
        getByte,
        setByte,
        getWord,
        setWord
    }
}

function Instructions (stdlib, foreign, heap) {
    "use asm";

    const registers = foreign.registers;

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

        const flags = registers.getFlags() | 0;
        const offset = getRel(insLoc + 1, 8) | 0;

        if ((flags & flag) === cmp) {
            // move to new location
            registers.incInstructionPointer(offset);
        }

        return offset | 0;
    }

    function setFlagsOPSZ (previous, result) {
        previous = previous | 0;
        result = result | 0;

        const flags = registers.flags;
        let flagState = registers.getFlags();

        let clearFlags = flags.All;
        let setFlags = 0;

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
        registers.setFlags(flagState);
    }

    function setFlagsACOPSZ (bits, previous, result) {
        bits = bits | 0;
        previous = previous | 0;
        result = result | 0;

        const flags = registers.flags;
        let flagState = registers.getFlags();

        let clearFlags = flags.All;
        let setFlags = 0;

        if ((result & (1 << bits)) > 0) {
            clearFlags = clearFlags ^ flags.CF;
        } else {
            setFlags = setFlags | flags.CF;
        }

        if ((previous & 0b00010000) === (result & 0b00010000)) {
            clearFlags = clearFlags ^ flags.AF;
        } else {
            setFlags = setFlags | flags.AF;
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
        registers.setFlags(flagState);
    }

    function setFlagsCOPSZ (previous, result, carry) {
        previous = previous | 0;
        result = result | 0;
        carry = carry | 0;

        const flags = registers.flags;
        let flagState = registers.getFlags();

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
        registers.setFlags(flagState);
    }

    /**
     * Clears OF, CF
     * Sets SF, ZF, PF depending
     */
    function setFlags (result) {
        result = result | 0;

        const flags = registers.flags;
        let flagState = registers.getFlags();

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
        registers.setFlags(flagState);
    }

    function insAdd (bits, destVal, srcVal) {
        bits = bits | 0;
        destVal = destVal | 0;
        srcVal = srcVal | 0;

        const output = destVal + srcVal;

        setFlagsACOPSZ(bits, destVal, output);

        return output | 0;
    }

    function insSub (bits, destVal, srcVal) {
        bits = bits | 0;
        destVal = destVal | 0;
        srcVal = srcVal | 0;

        const output = destVal - srcVal;

        setFlagsACOPSZ(bits, destVal, output);

        return output | 0;
    }

    function insAnd (bits, destVal, srcVal) {
        bits = bits | 0;
        destVal = destVal | 0;
        srcVal = srcVal | 0;

        const output = destVal & srcVal;

        setFlags(output);

        return output | 0;
    }

    function insOr (bits, destVal, srcVal) {
        bits = bits | 0;
        destVal = destVal | 0;
        srcVal = srcVal | 0;

        const output = destVal | srcVal;

        setFlags(output);

        return output | 0;
    }

    function insXor (bits, destVal, srcVal) {
        bits = bits | 0;
        destVal = destVal | 0;
        srcVal = srcVal | 0;

        const output = destVal ^ srcVal;

        setFlags(output);

        return output | 0;
    }

    /**
     * Address lookup for register/memory operand
     *
     * NOTE: Calling code MUST handle displacement offset in case 6 for non-displacement 8 or 16
     *
     * @param memRegBits
     * @param addressingMode
     * @return {number}
     */
    function getAddress (memRegBits, addressingMode) {
        memRegBits = memRegBits | 0;
        addressingMode = addressingMode | 0;

        // Start with data segment register value
        let addr = registers.getSegment16Bit(registers.seg16.DS) * 16;

        switch (memRegBits) {
            case 0:
                addr += registers.getGeneral(16, registers.reg16.BX);
                addr += registers.getGeneral(16, registers.reg16.SI);
                break;
            case 1:
                addr += registers.getGeneral(16, registers.reg16.BX);
                addr += registers.getGeneral(16, registers.reg16.DI);
                break;
            case 2:
                addr += registers.getGeneral(16, registers.reg16.BP);
                addr += registers.getGeneral(16, registers.reg16.SI);
                break;
            case 3:
                addr += registers.getGeneral(16, registers.reg16.BP);
                addr += registers.getGeneral(16, registers.reg16.DI);
                break;
            case 4:
                addr += registers.getGeneral(16, registers.reg16.SI);
                break;
            case 5:
                addr += registers.getGeneral(16, registers.reg16.DI);
                break;
            case 6:
                switch (addressingMode) {
                    case 0:
                        // 16 bit displacement only
                        // NOTE: Not handled by this code
                        break;
                    case 1:
                    case 2:
                        addr += registers.getGeneral(16, registers.reg16.BP);
                        break;
                }

                break;
            case 7:
                addr += registers.getGeneral(16, registers.reg16.BX);
                break;
        }

        return addr | 0;
    }

    function execute() {
        const insLoc = registers.getInstructionLocation() | 0;
        const opCode = foreign.memory.getByte(insLoc) | 0;
        let opCodeBytes = 1;

        switch (opCode) {
            // ADD
            case 0x00:
                // Add r/m8, r8
            case 0x01:
                // Add r/m16, r16
            case 0x02:
                // Add r8, r/m8
            case 0x03: {
                // Add r16, r/m16
                let bits;

                switch (opCode & 0b01) {
                    case 0:
                        bits = 8;
                        break;
                    case 1:
                        bits = 16;
                        break;
                }

                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const memAddrMode = (modRM & 0b11000000) >> 6;
                const reg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                let memRegName;
                const regName = registers.lookup(bits, reg);

                let memRegValue = 0;
                let addr = 0;

                switch (memAddrMode) {
                    case 1:
                    case 2:
                        // mem with 8 / 16 bit displacement
                        addr = getRel(insLoc + 2, 8 * memAddrMode);
                        opCodeBytes += memAddrMode;
                        // fall through to common code
                    case 0:
                        // mem no displacement
                        addr += getAddress(memReg, memAddrMode);

                        // special case not handled by getAddress call
                        if (memAddrMode === 0 && memReg === 6) {
                            addr += getRel(insLoc + 2, 16);
                            opCodeBytes += 2;
                        }

                        memRegName = addr;
                        memRegValue = foreign.memory.get(bits, addr);
                        foreign.log("Fetch value ", memRegValue);
                        break;
                    case 3:
                        // register
                        memRegName = registers.lookup(bits, memReg);
                        memRegValue = registers.getGeneral(bits, memReg);
                        break;
                }

                const regValue = registers.getGeneral(bits, reg);

                let result;
                switch (opCode & 0b010) {
                    case 0b00:
                        result = insAdd(bits, memRegValue, regValue);
                        registers.setGeneral(bits, memReg, result);
                        foreign.log("ADD ", memRegName, ", ", regName);
                        break;
                    case 0b10:
                        result = insAdd(bits, regValue, memRegValue);
                        registers.setGeneral(bits, reg, result);
                        foreign.log("ADD ", regName, ", ", memRegName);
                        break;
                    default:
                        foreign.error("Invalid opcode being handled by 00/01/02/03 handler: ", opCode);
                }
                break;
            }
            case 0x04:
                // Add AL, imm8
            case 0x05: {
                // Add AX, imm16
                const bits = (opCode & 0b1) * 8 + 8;
                const reg = bits === 8 ? registers.reg8.AL : registers.reg16.AX;

                const imm = getImm(insLoc + 1, bits);
                opCodeBytes += bits / 8;
                const value = registers.getGeneral(bits, reg);
                const output = insAdd(bits, value, imm);

                registers.setGeneral(bits, reg, output);
                foreign.log(bits === 8 ? "ADD AL, " : "ADD AX, ", imm);
                break;
            }

            case 0x08:
                // OR r/m8, r8
            case 0x09:
                // OR r/m16, r16
            case 0x0A:
                // OR r8, r/m8
            case 0x0B: {
                // OR r16, r/m16
                let bits;

                switch (opCode & 0b01) {
                    case 0:
                        bits = 8;
                        break;
                    case 1:
                        bits = 16;
                        break;
                }

                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const memAddrMode = (modRM & 0b11000000) >> 6;
                const reg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                let memRegName;
                const regName = registers.lookup(bits, reg);

                let memRegValue = 0;
                let addr = 0;

                switch (memAddrMode) {
                    case 1:
                    case 2:
                        // mem with 8 / 16 bit displacement
                        addr = getRel(insLoc + 2, 8 * memAddrMode);
                        opCodeBytes += memAddrMode;
                    // fall through to common code
                    case 0:
                        // mem no displacement
                        addr += getAddress(memReg, memAddrMode);

                        // special case not handled by getAddress call
                        if (memAddrMode === 0 && memReg === 6) {
                            addr += getRel(insLoc + 2, 16);
                            opCodeBytes += 2;
                        }

                        memRegName = addr;
                        memRegValue = foreign.memory.get(bits, addr);
                        foreign.log("Fetch value ", memRegValue);
                        break;
                    case 3:
                        // register
                        memRegName = registers.lookup(bits, memReg);
                        memRegValue = registers.getGeneral(bits, memReg);
                        break;
                }

                const regValue = registers.getGeneral(bits, reg);

                let result;
                switch (opCode & 0b010) {
                    case 0b00:
                        result = insOr(bits, memRegValue, regValue);
                        registers.setGeneral(bits, memReg, result);
                        foreign.log("OR ", memRegName, ", ", regName);
                        break;
                    case 0b10:
                        result = insOr(bits, regValue, memRegValue);
                        registers.setGeneral(bits, reg, result);
                        foreign.log("OR ", regName, ", ", memRegName);
                        break;
                    default:
                        foreign.error("Invalid opcode being handled by 08/09/0A/0B handler: ", opCode);
                }

                break;
            }
            case 0x0C:
                // Or AL, imm8
            case 0x0D: {
                // Or AX, imm16
                const bits = (opCode & 0b1) * 8 + 8;
                const reg = bits === 8 ? registers.reg8.AL : registers.reg16.AX;

                const imm = getImm(insLoc + 1, bits);
                opCodeBytes += bits / 8;
                const value = registers.getGeneral(bits, reg);
                const output = insOr(bits, value, imm);

                registers.setGeneral(bits, reg, output);
                foreign.log(bits === 8 ? "OR AL, " : "OR AX, ", imm);
                break;
            }


            // case 0x06:
            //     // Push ES
            //     break;
            // case 0x07:
            //     // Pop ES
            //     break;
            //
            // case 0x0E:
            //     // Push CS
            //     break;
            // case 0x0F:
            //     // Pop CS
            //     break;
            //
            // // ADC
            // case 0x10:
            //     // Adc r/m8, r8
            //     break;
            // case 0x11:
            //     // Adc r/m16, r16
            //     break;
            // case 0x12:
            //     // Adc r8, r/m8
            //     break;
            // case 0x13:
            //     // Adc r16, r/m16
            //     break;
            // case 0x14:
            //     // Adc AL, d8
            //     break;
            // case 0x15:
            //     // Adc AX, d16
            //     break;
            //
            // // SBB
            // case 0x18:
            //     // Sbb r/m8, r8
            //     break;
            // case 0x19:
            //     // Sbb r/m16, r16
            //     break;
            // case 0x1A:
            //     // Sbb r8, r/m8
            //     break;
            // case 0x1B:
            //     // Sbb r16, r/m16
            //     break;
            // case 0x1C:
            //     // Sbb AL, d8
            //     break;
            // case 0x1D:
            //     // Sbb AX, d16
            //     break;
            //
            // case 0x16:
            //     // Push SS
            //     break;
            // case 0x17:
            //     // Pop SS
            //     break;
            //
            // case 0x1E:
            //     // Push DS
            //     break;
            // case 0x1F:
            //     // Pop DS
            //     break;

            case 0x20:
                // And r/m8, r8
            case 0x21:
                // And r/m16, r16
            case 0x22:
                // And r8, r/m8
            case 0x23: {
                // And r16, r/m16
                let bits;

                switch (opCode & 0b01) {
                    case 0:
                        bits = 8;
                        break;
                    case 1:
                        bits = 16;
                        break;
                }

                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const memAddrMode = (modRM & 0b11000000) >> 6;
                const reg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                let memRegName;
                const regName = registers.lookup(bits, reg);

                let memRegValue = 0;
                let addr = 0;

                switch (memAddrMode) {
                    case 1:
                    case 2:
                        // mem with 8 / 16 bit displacement
                        addr = getRel(insLoc + 2, 8 * memAddrMode);
                        opCodeBytes += memAddrMode;
                    // fall through to common code
                    case 0:
                        // mem no displacement
                        addr += getAddress(memReg, memAddrMode);

                        // special case not handled by getAddress call
                        if (memAddrMode === 0 && memReg === 6) {
                            addr += getRel(insLoc + 2, 16);
                            opCodeBytes += 2;
                        }

                        memRegName = addr;
                        memRegValue = foreign.memory.get(bits, addr);
                        foreign.log("Fetch value ", memRegValue);
                        break;
                    case 3:
                        // register
                        memRegName = registers.lookup(bits, memReg);
                        memRegValue = registers.getGeneral(bits, memReg);
                        break;
                }

                const regValue = registers.getGeneral(bits, reg);

                if (opCode === 0x20) {
                    const result = insAnd(bits, memRegValue, regValue);
                    registers.setGeneral(bits, memReg, result);
                    foreign.log("AND ", memRegName, ", ", regName);
                } else if (opCode === 0x22) {
                    const result = insAnd(bits, memRegValue, regValue);
                    registers.setGeneral(bits, reg, result);
                    foreign.log("AND ", regName, ", ", memRegName);
                } else {
                    foreign.error("Invalid opcode being handled by 20/21/22/23 handler: ", opCode);
                }

                break;
            }
            case 0x24:
                // And AL, imm8
            case 0x25: {
                // And AX, imm16
                const bits = (opCode & 0b1) * 8 + 8;
                const reg = bits === 8 ? registers.reg8.AL : registers.reg16.AX;

                const imm = getImm(insLoc + 1, bits);
                opCodeBytes += bits / 8;
                const value = registers.getGeneral(bits, reg);
                const output = insAnd(bits, value, imm);

                registers.setGeneral(bits, reg, output);
                foreign.log(bits === 8 ? "AND AL, " : "AND AX, ", imm);
                break;
            }

            case 0x28:
            // Sub r/m8, r8
            case 0x29:
            // Sub r/m16, r16
            case 0x2A:
            // Sub r8, r/m8
            case 0x2B: {
                // OR r16, r/m16
                let bits;

                switch (opCode & 0b01) {
                    case 0:
                        bits = 8;
                        break;
                    case 1:
                        bits = 16;
                        break;
                }

                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const memAddrMode = (modRM & 0b11000000) >> 6;
                const reg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                let memRegName;
                const regName = registers.lookup(bits, reg);

                let memRegValue = 0;
                let addr = 0;

                switch (memAddrMode) {
                    case 1:
                    case 2:
                        // mem with 8 / 16 bit displacement
                        addr = getRel(insLoc + 2, 8 * memAddrMode);
                        opCodeBytes += memAddrMode;
                    // fall through to common code
                    case 0:
                        // mem no displacement
                        addr += getAddress(memReg, memAddrMode);

                        // special case not handled by getAddress call
                        if (memAddrMode === 0 && memReg === 6) {
                            addr += getRel(insLoc + 2, 16);
                            opCodeBytes += 2;
                        }

                        memRegName = addr;
                        memRegValue = foreign.memory.get(bits, addr);
                        foreign.log("Fetch value ", memRegValue);
                        break;
                    case 3:
                        // register
                        memRegName = registers.lookup(bits, memReg);
                        memRegValue = registers.getGeneral(bits, memReg);
                        break;
                }

                const regValue = registers.getGeneral(bits, reg);

                let result;

                switch (opCode & 0b010) {
                    case 0b00:
                        result = insSub(bits, memRegValue, regValue);
                        registers.setGeneral(bits, memReg, result);
                        foreign.log("SUB ", memRegName, ", ", regName);
                        break;
                    case 0b10:
                        result = insSub(bits, regValue, memRegValue);
                        registers.setGeneral(bits, reg, result);
                        foreign.log("SUB ", regName, ", ", memRegName);
                        break;
                    default:
                        foreign.error("Invalid opcode being handled by 28/29/2A/2B handler: ", opCode);
                }

                break;
            }
            case 0x2C:
                // Sub AL, imm8
            case 0x2D: {
                // Sub AX, imm16
                const bits = (opCode & 0b1) * 8 + 8;
                const reg = bits === 8 ? registers.reg8.AL : registers.reg16.AX;

                const imm = getImm(insLoc + 1, bits);
                opCodeBytes += bits / 8;
                const value = registers.getGeneral(bits, reg);
                const output = insSub(bits, value, imm);

                registers.setGeneral(bits, reg, output);
                foreign.log(bits === 8 ? "SUB AL, " : "SUB AX, ", imm);
                break;
            }

            case 0x30:
                // XOR r/m8, r8
            case 0x31:
                // XOR r/m16, r16
            case 0x32:
                // XOR r8, r/m8
            case 0x33: {
                // XOR r16, r/m16
                let bits;

                switch (opCode & 0b01) {
                    case 0:
                        bits = 8;
                        break;
                    case 1:
                        bits = 16;
                        break;
                }

                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const memAddrMode = (modRM & 0b11000000) >> 6;
                const reg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                let memRegName;
                const regName = registers.lookup(bits, reg);

                let memRegValue = 0;
                let addr = 0;

                switch (memAddrMode) {
                    case 1:
                    case 2:
                        // mem with 8 / 16 bit displacement
                        addr = getRel(insLoc + 2, 8 * memAddrMode);
                        opCodeBytes += memAddrMode;
                    // fall through to common code
                    case 0:
                        // mem no displacement
                        addr += getAddress(memReg, memAddrMode);

                        // special case not handled by getAddress call
                        if (memAddrMode === 0 && memReg === 6) {
                            addr += getRel(insLoc + 2, 16);
                            opCodeBytes += 2;
                        }

                        memRegName = addr;
                        memRegValue = foreign.memory.get(bits, addr);
                        foreign.log("Fetch value ", memRegValue);
                        break;
                    case 3:
                        // register
                        memRegName = registers.lookup(bits, memReg);
                        memRegValue = registers.getGeneral(bits, memReg);
                        break;
                }

                const regValue = registers.getGeneral(bits, reg);

                let result;

                switch (opCode & 0b010) {
                    case 0b00:
                        result = insXor(bits, memRegValue, regValue)
                        registers.setGeneral(bits, memReg, result);
                        foreign.log("XOR ", memRegName, ", ", regName);
                        break;
                    case 0b10:
                        result = insXor(bits, regValue, memRegValue);
                        registers.setGeneral(bits, reg, result);
                        foreign.log("XOR ", regName, ", ", memRegName);
                        break;
                    default:
                        foreign.error("Invalid opcode being handled by 30/31/32/33 handler: ", opCode);
                }

                break;
            }
            case 0x34:
                // XOR AL, imm8
            case 0x35: {
                // XOR AX, imm16
                const bits = (opCode & 0b1) * 8 + 8;
                const reg = bits === 8 ? registers.reg8.AL : registers.reg16.AX;

                const imm = getImm(insLoc + 1, bits);
                opCodeBytes += bits / 8;
                const value = registers.getGeneral(bits, reg);
                const output = insXor(bits, value, imm);

                registers.setGeneral(bits, reg, output);
                foreign.log(bits === 8 ? "XOR AL, " : "XOR AX, ", imm);
                break;
            }

            case 0x38:
            // OR r/m8, r8
            case 0x39:
            // OR r/m16, r16
            case 0x3A:
            // OR r8, r/m8
            case 0x3B: {
                // OR r16, r/m16
                let bits;

                switch (opCode & 0b01) {
                    case 0:
                        bits = 8;
                        break;
                    case 1:
                        bits = 16;
                        break;
                }

                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const memAddrMode = (modRM & 0b11000000) >> 6;
                const reg = (modRM & 0b00111000) >> 3;
                const memReg = modRM & 0b00000111;

                let memRegName;
                const regName = registers.lookup(bits, reg);

                let memRegValue = 0;
                let addr = 0;

                switch (memAddrMode) {
                    case 1:
                    case 2:
                        // mem with 8 / 16 bit displacement
                        addr = getRel(insLoc + 2, 8 * memAddrMode);
                        opCodeBytes += memAddrMode;
                    // fall through to common code
                    case 0:
                        // mem no displacement
                        addr += getAddress(memReg, memAddrMode);

                        // special case not handled by getAddress call
                        if (memAddrMode === 0 && memReg === 6) {
                            addr += getRel(insLoc + 2, 16);
                            opCodeBytes += 2;
                        }

                        memRegName = addr;
                        memRegValue = foreign.memory.get(bits, addr);
                        foreign.log("Fetch value ", memRegValue);
                        break;
                    case 3:
                        // register
                        memRegName = registers.lookup(bits, memReg);
                        memRegValue = registers.getGeneral(bits, memReg);
                        break;
                }

                const regValue = registers.getGeneral(bits, reg);

                let result;

                switch (opCode & 0b010) {
                    case 0b00:
                        result = insSub(bits, memRegValue, regValue);
                        foreign.log("CMP ", memRegName, ", ", regName);
                        break;
                    case 0b10:
                        result = insSub(bits, regValue, memRegValue);
                        foreign.log("CMP ", regName, ", ", memRegName);
                        break;
                    default:
                        foreign.error("Invalid opcode being handled by 38/39/3A/3B handler: ", opCode);
                }

                break;
            }
            case 0x3C:
            // Or AL, imm8
            case 0x3D: {
                // Or AX, imm16
                const bits = (opCode & 0b1) * 8 + 8;
                const reg = bits === 8 ? registers.reg8.AL : registers.reg16.AX;

                const imm = getImm(insLoc + 1, bits);
                opCodeBytes += bits / 8;
                const value = registers.getGeneral(bits, reg);
                const output = insSub(bits, value, imm);

                foreign.log(bits === 8 ? "CMP AL, " : "CMP AX, ", imm);
                break;
            }

            case 0x40:
            case 0x41:
            case 0x42:
            case 0x43:
            case 0x44:
            case 0x45:
            case 0x47:
            case 0x48:
            case 0x49:
            case 0x4A:
            case 0x4B:
            case 0x4C:
            case 0x4D:
            case 0x4E:
            case 0x4F:
                // INC/DEC r16
                const reg = opCode & 0b00000111;
                const regName = registers.reg16.lookup(reg);
                const regValue = registers.getGeneral16Bit(reg);
                let newValue = 0;

                // Select bit that denotes specific action
                switch (opCode & 0b00001000) {
                    case 0x00:
                        newValue = (regValue + 1) | 0;
                        registers.setGeneral16Bit(reg, newValue);
                        foreign.log("INC ", regName);
                        break;
                    case 0x08:
                        newValue = (regValue - 1) | 0;
                        registers.setGeneral16Bit(reg, newValue);
                        foreign.log("DEC ", regName);
                        break;
                    default:
                        foreign.error("Invalid opcode being handled by 4x handler: ", opCode);
                }
                setFlagsOPSZ(regValue, newValue);

                break;
            case 0x70:{
                // JO
                const OF = registers.flags.OF;
                const offset = flagJmp(insLoc, OF, OF);
                opCodeBytes += 1;

                foreign.log("JO ", offset);
                break;
            }
            case 0x71: {
                // JNO
                const OF = registers.flags.OF;
                const offset = flagJmp(insLoc, OF, 0);
                opCodeBytes += 1;

                foreign.log("JNO ", offset);
                break;
            }
            case 0x72: {
                // JC, JB, JNAE
                const CF = registers.flags.CF;
                const offset = flagJmp(insLoc, CF, CF);
                opCodeBytes += 1;

                foreign.log("JC/JB/JNAE ", offset);
                break;
            }
            case 0x73: {
                // JNC, JNB, JAE
                const CF = registers.flags.CF;
                const offset = flagJmp(insLoc, CF, 0);
                opCodeBytes += 1;

                foreign.log("JNC/JNB/JAE ", offset);
                break;
            }
            case 0x74: {
                // JE, JZ
                const ZF = registers.flags.ZF;
                const offset = flagJmp(insLoc, ZF, ZF);
                opCodeBytes += 1;

                foreign.log("JZ/JE ", offset);
                break;
            }
            case 0x75: {
                // JNE, JNZ
                const ZF = registers.flags.ZF;
                const offset = flagJmp(insLoc, ZF, 0);
                opCodeBytes += 1;

                foreign.log("JNZ/JNE ", offset);
                break;
            }
            case 0x76: {
                // JBE, JNA
                const flags = registers.flags.CF | registers.flags.ZF;
                const offset = flagJmp(insLoc, flags, flags);
                opCodeBytes += 1;

                foreign.log("JBE/JNA ", offset);
                break;
            }
            case 0x77: {
                // JNBE, JA
                const flags = registers.flags.CF | registers.flags.ZF;
                const offset = flagJmp(insLoc, flags, 0);
                opCodeBytes += 1;

                foreign.log("JNBE/JA ", offset);
                break;
            }
            case 0x78: {
                // JS
                const SF = registers.flags.SF;
                const offset = flagJmp(insLoc, SF, SF);
                opCodeBytes += 1;

                foreign.log("JS ", offset);
                break;
            }
            case 0x79: {
                // JNS
                const SF = registers.flags.SF;
                const offset = flagJmp(insLoc, SF, 0);
                opCodeBytes += 1;

                foreign.log("JNS ", offset);
                break;
            }
            case 0x7A: {
                // JP/JPE
                const PF = registers.flags.PF;
                const offset = flagJmp(insLoc, PF, PF);
                opCodeBytes += 1;

                foreign.log("JP/JPE ", offset);
                break;
            }
            case 0x7B: {
                // JNP/ JPO
                const PF = registers.flags.PF;
                const offset = flagJmp(insLoc, PF, 0);
                opCodeBytes += 1;

                foreign.log("JNP/JPO ", offset);
                break;
            }

            case 0x80:
                // ADD/OR/ADC/SBB/AND/SUB/XOR/CMP r/m8, imm8
            case 0x81:
                // ADD/OR/ADC/SBB/AND/SUB/XOR/CMP r/m16, imm16
            case 0x83:
                // ADD/OR/ADC/SBB/AND/SUB/XOR/CMP r/m16, imm8
                {

                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const subOpCode = modRM & 0b00111000;
                const reg = modRM & 0b00000111;

                let regName;
                let bits;
                let imm;

                switch (opCode) {
                    case 0x80:
                        regName = registers.reg8.lookup(reg);
                        imm = getImm(insLoc + 2, 8);
                        opCodeBytes += 1;
                        bits = 8;
                        break;
                    case 0x81:
                        regName = registers.reg16.lookup(reg);
                        imm = getImm(insLoc + 2, 16);
                        opCodeBytes += 2;
                        bits = 16;
                        break;
                    case 0x83:
                        regName = registers.reg16.lookup(reg);
                        imm = getImm(insLoc + 2, 8);
                        opCodeBytes += 1;
                        bits = 16;
                        break;
                    default:
                        foreign.error("Unsupported opcode in 80, 81, 83. ", opCode);
                        return;
                }


                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, modRM, regName, "Memory lookup not supported");
                    return;
                }

                const regValue = registers.getGeneral(bits, reg);
                let result;
                let carry;

                switch (subOpCode) {
                    case 0x00:
                        result = insAdd(bits, regValue, imm);

                        registers.setGeneral(bits, reg, result);

                        foreign.log("ADD  ", regName, ", ", imm);
                        break;
                    case 0x08:
                        result = regValue | imm;

                        foreign.error("OR ", regName, ", ", imm);
                        return;
                    case 0x10:
                        carry = registers.isFlagSet(registers.flags.CF);
                        result = insAdd(bits, regValue, imm + (carry ? 1 : 0));

                        registers.setGeneral(bits, reg, result);

                        foreign.log("ADC ", regName, ", ", imm);
                        break;
                    case 0x18:
                        carry = registers.isFlagSet(registers.flags.CF);
                        result = regValue - imm - (carry ? 1 : 0);

                        foreign.error("SBB ", regName, ", ", imm);
                        return;
                    case 0x20:
                        result = regValue & imm;

                        foreign.error("AND ", regName, ", ", imm);
                        return;
                    case 0x28:
                        result = insSub(bits, regValue, imm);

                        registers.setGeneral(bits, reg, result);

                        foreign.log("SUB ", regName, ", ", imm);
                        break;
                    case 0x30:
                        result = regValue ^ imm;

                        foreign.error("XOR ", regName, ", ", imm);
                        return;
                    case 0x38:
                        result = insSub(bits, regValue, imm);
                        // Calculate flags but don't save result

                        foreign.log("CMP ", regName, ", ", imm);
                        break;
                }
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

                const memRegName = registers.reg8.lookup(memReg);
                const regName = registers.reg8.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, " ", modRM, " ", regName, " ", memRegName, " Memory lookup not supported");
                    return;
                }

                if (opCode === 0x88) {
                    const regValue = registers.getGeneral8Bit(reg);
                    registers.setGeneral8Bit(memReg, regValue);

                    foreign.log("MOV ", memRegName, ", ", regName);
                } else if (opCode === 0x8A) {
                    const memRegValue = registers.getGeneral8Bit(memReg);
                    registers.setGeneral8Bit(reg, memRegValue);

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

                const memRegName = registers.reg16.lookup(memReg);
                const regName = registers.reg16.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, " ", modRM, " ", regName, " ", memRegName, " Memory lookup not supported");
                    return;
                }

                if (opCode === 0x89) {
                    const regValue = registers.getGeneral16Bit(reg);
                    registers.setGeneral16Bit(memReg, regValue);

                    foreign.log("MOV ", memRegName, ", ", regName);
                } else if (opCode === 0x8B) {
                    const memRegValue = registers.getGeneral16Bit(memReg);
                    registers.setGeneral16Bit(reg, memRegValue);

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

                const memRegName = registers.reg16.lookup(memReg);
                const segRegName = registers.seg16.lookup(segReg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, " ", modRM, " ", segRegName, " ", memRegName, " Memory lookup not supported");
                    return;
                }

                if (opCode === 0x8C) {
                    const segRegValue = registers.getSegment16Bit(segReg);
                    registers.setGeneral16Bit(memReg, segRegValue);

                    foreign.log("MOV ", memRegName, ", ", segRegName);
                } else if (opCode === 0x8E) {
                    const memRegValue = registers.getGeneral16Bit(memReg);
                    registers.setSegment16Bit(segReg, memRegValue);

                    foreign.log("MOV ", segRegName, ", ", memRegName);
                } else {
                    foreign.error("Invalid opcode being handled by 8C/8E handler: ", opCode);
                }
                break;
            }

            case 0x90: {
                // NOP
                foreign.log("NOP");
                break;
            }

            case 0x9E: {
                // SAHF

                // get AH value
                const AH = registers.getGeneral8Bit(registers.reg8.AH) | 0;
                // get flags that they will be combined with (high part of value)
                const flags = registers.getFlags() & 0b1111111100000000;

                // Ensure always off and always on values are correct and combine with high part of flags
                const result = AH & 0b11010101 | flags;

                registers.setFlags(result);

                foreign.log("SAHF (", AH.toString(2), ")");
                break;
            }
            case 0x9F: {
                // LAHF
                const flags = registers.getFlags() & 0b11111111;
                registers.setGeneral8Bit(registers.reg8.AH, flags);

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
                registers.setGeneral8Bit(reg, imm);

                const regStr = registers.reg8.lookup(reg);
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
                registers.setGeneral16Bit(reg, imm);

                const regStr = registers.reg16.lookup(reg);
                foreign.log("MOV ", regStr, ", ", imm);
                break;
            }

            case 0xC2:
            case 0xC3: {
                // RETN [imm16]
                let imm = 0;
                if ((opCode & 0b00000010) === 1) {
                    imm = getImm(insLoc + 1, 16);
                }
                const ss = registers.getSegment16Bit(registers.seg16.SS);
                const sp = registers.getGeneral16Bit(registers.reg16.SP);
                const ip = foreign.memory.get(16, ss * 16 + sp);
                imm = imm + 2;
                foreign.log("Fetch value for IP ", ip);

                // don't adjust opcode as we are relocating the IP reg
                opCodeBytes = 0;
                // set new IP value
                registers.setInstructionPointer(ip);
                // adjust sp by address and extra values (stack grows memory)
                registers.setGeneral16Bit(registers.reg16.SP, sp + imm);

                if ((opCode & 0b00000010) === 1) {
                    foreign.log("RETN ", imm);
                } else {
                    foreign.log("RETN");
                }
                break;
            }

            case 0xCA:
            case 0xCB: {
                // RETF [imm16]
                let imm = 0;
                if ((opCode & 0b00000010) === 1) {
                    imm = getImm(insLoc + 1, 16);
                }
                const ss = registers.getSegment16Bit(registers.seg16.SS);
                const sp = registers.getGeneral16Bit(registers.reg16.SP);
                const ip = foreign.memory.get(16, ss * 16 + sp);
                const cs = foreign.memory.get(16, ss * 16 + sp + 2);
                imm = imm + 4;
                foreign.log("Fetch value for IP ", ip);
                foreign.log("Fetch value for CS ", cs);

                // don't adjust opcode as we are relocating the IP reg
                opCodeBytes = 0;
                registers.setSegment16Bit(registers.seg16.CS, cs);
                // set new IP value
                registers.setInstructionPointer(ip);
                // adjust sp by address and extra values (stack grows memory)
                registers.setGeneral16Bit(registers.reg16.SP, sp + imm);

                if ((opCode & 0b00000010) === 1) {
                    foreign.log("RETF ", imm);
                } else {
                    foreign.log("RETF");
                }
                break;
            }

            case 0xD0:{
                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const subOpCode = modRM & 0b00111000;
                const reg = modRM & 0b00000111;
                const regName = registers.reg8.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, modRM, regName, "Memory lookup not supported");
                    return;
                }

                const regValue = registers.getGeneral8Bit(reg);
                const shifterValue = 1;

                switch (subOpCode) {
                    case 0x00:
                        foreign.error("ROL  ", regName, ", 1");
                        return;
                    case 0x08:
                        foreign.error("ROR ", regName, ", 1");
                        return;
                    case 0x10:
                        foreign.error("RCL ", regName, ", 1");
                        return;
                    case 0x18:
                        foreign.error("RCR ", regName, ", 1");
                        return;
                    case 0x20:
                        const output = regValue << shifterValue;
                        const carry = output & 0b100000000 > 0;

                        registers.setGeneral8Bit(reg, output);
                        setFlagsCOPSZ(regValue, output, carry);

                        foreign.log("SHL ", regName, ", 1");
                        break;
                    case 0x28:
                        foreign.error("SHR ", regName, ", 1");
                        return;
                    case 0x30:
                        foreign.error("SAL ", regName, ", 1");
                        return;
                    case 0x38:
                        foreign.error("SAR ", regName, ", 1");
                        return;
                }
                break;
            }
            case 0xD2:{
                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const subOpCode = modRM & 0b00111000;
                const reg = modRM & 0b00000111;
                const regName = registers.reg8.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, modRM, regName, "Memory lookup not supported");
                    return;
                }

                const regValue = registers.getGeneral8Bit(reg);
                const shifterValue = registers.getGeneral8Bit(registers.reg8.CL);

                switch (subOpCode) {
                    case 0x00:
                        foreign.error("ROL ", regName, ", CL");
                        return;
                    case 0x08:
                        foreign.error("ROR ", regName, ", CL");
                        return;
                    case 0x10:
                        foreign.error("RCL ", regName, ", CL");
                        return;
                    case 0x18:
                        foreign.error("RCR ", regName, ", CL");
                        return;
                    case 0x20: {
                        const output = regValue << shifterValue;

                        registers.setGeneral8Bit(reg, output);
                        setFlagsCOPSZ(regValue, output);

                        foreign.log("SHL ", regName, ", CL");
                        break;
                    }
                    case 0x28: {
                        const output = regValue >> shifterValue;
                        const carry = ((1 << shifterValue - 1) & regValue) >> (shifterValue - 1);

                        registers.setGeneral8Bit(reg, output);
                        setFlagsCOPSZ(regValue, output, carry);

                        foreign.log("SHR ", regName, ", CL");
                        break;
                    }
                    case 0x30:
                        foreign.error("SAL ", regName, ", CL");
                        return;
                    case 0x38:
                        foreign.error("SAR ", regName, ", CL");
                        return;
                }
                break;
            }

            case 0xE0:
                // LOOPNZ/LOOPNE rel8
            case 0xE1:
                // LOOPZ/LOOPE rel8
            case 0xE2: {
                // LOOP rel8
                let cont = true;

                if ((opCode & 0b010) === 0) {
                    const zf = registers.getFlags() & registers.flags.ZF;
                    // mask 0 bit (to distinct Z vs NZ, compare with ZF (moved into 0 bit)
                    cont = (opCode & 0b01) === (zf >> 5);
                }

                const imm = getRel(insLoc + 1, 8);
                opCodeBytes += 1;
                const cx = registers.reg16.CX;
                const cxVal = registers.getGeneral16Bit(cx) - 1;
                registers.setGeneral16Bit(cx, cxVal);

                if (cxVal !== 0 && cont) {
                    registers.incInstructionPointer(imm);
                }

                switch (opCode & 0b011) {
                    case 0x0:
                        foreign.log("LOOPNZ/NE ", imm);
                        break;
                    case 0x1:
                        foreign.log("LOOPZ/E ", imm);
                        break;
                    case 0x2:
                        foreign.log("LOOP ", imm);
                        break;
                }

                break;
            }
            case 0xE4:
                // OUT imm16, AL
            case 0xE5: {
                // OUT imm16, AX
                const bits = (opCode & 0b1) === 0 ? 8 : 16;
                const reg = bits === 8 ? registers.reg8.AL : registers.reg16.AX;
                const imm = getImm(insLoc + 1, 8);
                opCodeBytes += 1;

                const data = foreign.bus.read(bits, imm);
                registers.setGeneral(bits, reg, data);
                foreign.log("OUT imm8, ", bits === 8 ? "AL" : "AX");
                break;
            }
            case 0xE6:
                // OUT imm8, AL
            case 0xE7: {
                // OUT imm16, AX
                const bits = (opCode & 0b1) === 0 ? 8 : 16;
                const reg = bits === 8 ? registers.reg8.AL : registers.reg16.AX;
                const data = registers.getGeneral(bits, reg);
                const imm = getImm(insLoc + 1, 8);
                opCodeBytes += 1;

                foreign.bus.write(bits, imm, data);
                foreign.log("OUT imm8, ", bits === 8 ? "AL" : "AX");
                break;
            }

            case 0xEB: {
                // JMP
                const offset = getRel(insLoc + 1, 8);
                opCodeBytes += 1;
                // move to new location
                registers.incInstructionPointer(offset);

                foreign.log("JMP ", offset);
                break;
            }

            case 0xEE: {
                // OUT DX, AL
                const regData = registers.reg8.AL;
                const data = registers.getGeneral8Bit(regData);
                const regAddr = registers.reg16.DX;
                const addr = registers.getGeneral16Bit(regAddr);

                foreign.bus.write(8, addr, data);
                foreign.log("OUT DX, AL");
                break;
            }
            case 0xEF: {
                // OUT DX, AX
                const reg = registers.reg16.AX;
                const data = registers.getGeneral16Bit(reg);
                const regAddr = registers.reg16.DX;
                const addr = registers.getGeneral16Bit(regAddr);

                foreign.bus.write(8, addr, data);
                foreign.log("OUT DX, AX");
                break;
            }


            case 0xF4:
                // keep the IP constant
                opCodeBytes = 0;
                foreign.error("HLT");
                break;

            case 0xF8:
                // CLC
                registers.clearCarryFlag();
                foreign.log("CLC");
                break;
            case 0xF9:
                // STC
                registers.setCarryFlag();
                foreign.log("STC");
                break;
            case 0xFA:
                // CLI
                registers.clearInterruptFlag();
                foreign.log("CLI");
                break;
            case 0xFB:
                // STI
                registers.setInterruptFlag();
                foreign.log("STI");
                break;
            case 0xFC:
                // CLD
                registers.clearDirectionFlag();
                foreign.log("CLD");
                break;
            case 0xFD:
                // STD
                registers.setDirectionFlag();
                foreign.log("STD");
                break;
            case 0xFE: {
                // INC/DEC r/m8
                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const subOpCode = modRM & 0b00111000;
                const reg = modRM & 0b00000111;
                const regName = registers.reg8.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, modRM, regName, "Memory lookup not supported");
                    return;
                }

                const regValue = registers.getGeneral8Bit(reg);
                let newValue = 0;

                // cpu ignores unmapped sub codes and treats and wraps around to match
                switch (subOpCode & 0b00001000) {
                    case 0x00:
                        newValue = (regValue + 1) | 0;
                        registers.setGeneral8Bit(reg, newValue);
                        foreign.log("INC ", regName);
                        break;
                    case 0x08:
                        newValue = (regValue - 1) | 0;
                        registers.setGeneral8Bit(reg, newValue);
                        foreign.log("DEC ", regName);
                        break;
                }
                setFlagsOPSZ(regValue, newValue);
                break;
            }
            case 0xFF: {
                // INC/DEC r/m16, CALL/JMP r/m16, PUSH r/m16
                const modRM = getModRM(insLoc + 1);
                opCodeBytes += 1;

                const mem = modRM & 0b11000000;
                const subOpCode = modRM & 0b00111000;
                const reg = modRM & 0b00000111;
                const regName = registers.reg16.lookup(reg);

                if ((mem ^ 0b11000000) !== 0) {
                    foreign.error(opCode, modRM, regName, "Memory lookup not supported");
                    return;
                }

                const regValue = registers.getGeneral16Bit(reg);
                let newValue = 0;

                // cpu ignores unmapped sub codes and treats and wraps around to match
                switch (subOpCode & 0b00111000) {
                    case 0x00:
                        newValue = (regValue + 1) | 0;
                        registers.setGeneral8Bit(reg, newValue);
                        setFlagsOPSZ(regValue, newValue);
                        foreign.log("INC ", regName);
                        break;
                    case 0x08:
                        newValue = (regValue - 1) | 0;
                        registers.setGeneral8Bit(reg, newValue);
                        setFlagsOPSZ(regValue, newValue);
                        foreign.log("DEC ", regName);
                        break;
                    case 0x10:
                    case 0x18:
                        foreign.error("CALL ", regName);
                        return;
                    case 0x20:
                    case 0x28:
                        foreign.error("JMP", regName);
                        return;
                    case 0x30:
                    case 0x38:
                        foreign.error("PUSH");
                        return;
                }
                break;
            }
            default:
                // Assume one byte instruction
                foreign.error(insLoc.toString(16), " : ", opCode.toString(16), " : ", "Unknown instruction");
                break;
        }

        registers.incInstructionPointer(opCodeBytes);
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

export function Test (biosBinary) {
    // Heap for registers
    const registerData = new ArrayBuffer(64);
    // Heap for main memory
    const memoryData = new ArrayBuffer(Math.pow(2, 18));
    // Heap for memory mapped bios data
    const biosData = Uint8Array.from(biosBinary);
    // Heap for bus, holds a 16 bit value at each address as a buffer between emulation parts
    const busData = new ArrayBuffer(1024 * 2);

    const bus = new Bus(window, {}, busData);
    const registers = new Registers(window, {}, registerData);
    const memory = new Memory(window, {}, memoryData);
    const bios = new Memory(window, {}, biosData);
    bios.setOffset(0xF0000);

    registers.setInstructionPointer(0x0000);
    registers.setSegment16Bit(registers.seg16.CS, 0xF000);

    function MappedMemory() {
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
            if (loc < memoryData.length) {
                // is part of the main memory
                return memory;
            } else if (loc >= 0xF0000 && loc < 0x100000) {
                // is part of the bios mapped memory
                return bios;
            } else {
                // console.log("Unknown memory access at: " + loc.toString(16))
                return noMemory;
            }
        }

        return {
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

    const logs = [];
    const errors = [];
    const addLog = (...log) => logs.push(log.join(""));
    const addErr = (...log) => logs.push("Error: " + log.join(""));
    // const addError = (...err) => errors.push(err.join(""));

    const mappedMemory = new MappedMemory();
    const cpu = new Instructions(window, {registers, memory: mappedMemory, bus, log: addLog, error: addErr}, null);

    // const logPosAndCode = () => {
    //     const IP = registers.getInstructionLocation();
    //     addLog(`0:${numToHex(IP)} Op ${numToHex(mappedMemory.getByte(IP))}`);
    // }
    // let steps = 0;
    // while (errors.length === 0 && steps < 100) {
    //     // logPosAndCode();
    //     cpu.execute();
    //     steps++;
    // }
    // logPosAndCode();
    // console.log(errors[0]);

    return {
        logs,
        errors,
        cpu,
        registers,
        memory: mappedMemory,
        bus
    };
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




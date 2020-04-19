"use strict";

import {Register, reg} from "./register";
import {Immediate} from "./immediate";

export class Instruction {
    constructor (instruction, name, opcodes, group) {
        this.key = instruction;
        this.name = name;
        this.opcodes = opcodes;
        this.type = "INSTRUCTION";
        this.group = group;
    }

    findOpCode (operands) {
        return this.opcodes.find((opcode) => opcode.match(operands));
    }

    toString () {
        return `Instruction (${this.key})`;
    }
}

/*
Op code formats
1 byte - instruction no operand : Lock, rep..., hlt, cmc, clc, stc, cli, sti, cld, std, salc, xlat, wait, ...
1 byte - instruction with implied register (8/16bit) : Push, pop, inc, dec, xchg
2 byte - instruction with implied register (8 bit) + immediate data (8 bit) : Add, adc, and, xor, or, sbb, sub, cmp, mov, test
3 byte - instruction with implied register (16bit) + immediate data (16 bit) : Add, adc, and, xor, or, sbb, sub, cmp, mov, test
2 byte+ - instruction + ModR/M byte + displacement byte/s
 */

class Parameter {
    constructor (bits) {
        this.bits = bits;
    }

    asString () {
        switch (this.bits) {
            case 8:
                return "b";
            case 16:
                return "w";
            case 32:
                return "d";
            case 64:
                return "q";
            default:
                return "?";
        }
    }
}

class ImmParam extends Parameter {
    constructor (bits) {
        super(bits);
    }

    match (op) {
        return (op instanceof Immediate && op.bits <= this.bits);
    }

    asOpString () {
        return "i" + this.asString();
    }

    asInsString () {
        return "imm" + this.bits;
    }
}

class FixedImmParam extends Parameter {
    constructor (val) {
        super(0);

        this.value = val;
    }

    match (op) {
        return (op instanceof Immediate && op.value === this.value);
    }

    asOpString () {
        return "";
    }

    asInsString () {
        return this.value;
    }
}

class FixedRegParam extends Parameter {
    constructor (r) {
        const register = reg(r);
        super(register.bits);

        this.register = register
    }

    match (op) {
        return (op instanceof Register && op.key === this.register.key);
    }

    asOpString () {
        return "";
    }

    asInsString () {
        return this.register.key;
    }
}

class RegParam extends Parameter {
    constructor (bits, type) {
        super(bits);

        this.type = type;
    }

    match (op) {
        return (op instanceof Register && op.bits === this.bits && op.types.includes(this.type));
    }

    asOpString () {
        return "/r";
    }

    asInsString () {
        return "r" + this.bits;
    }
}

class RegMemParam extends Parameter {
    constructor (bits, type) {
        super(bits);

        this.type = type;
    }

    match (op) {
        return (op instanceof Register && op.bits === this.bits && op.types.includes(this.type));
    }

    asOpString () {
        return "/r";
    }

    asInsString () {
        return "r/m" + this.bits;
    }
}

class RelParam extends Parameter {
    constructor (bits) {
        super(bits);
    }

    match (op) {
        return (op instanceof Immediate && op.bits <= this.bits);
    }

    asOpString () {
        return "c" + this.asString();
    }

    asInsString () {
        return "rel" + this.bits;
    }
}

// TODO: ptr is actually made up of two operands
class PtrParam extends Parameter {
    constructor (bits) {
        super(bits);
    }

    match (op) {
        return (op instanceof Immediate && op.bits <= this.bits);
    }

    asOpString () {
        return "c" + this.asString();
    }

    asInsString () {
        return "ptr" + this.bits;
    }
}

class OpCodeBase {
    /**
     * Base class of OpCodes
     *
     * @param {string} code Instruction OpCode in Hex Notation
     * @param {string|null} subCode Instruction SubOpCode in Hex Notation
     * @param {[]} operands Array of operand types [R, M, I]
     */
    constructor (code, subCode, operands) {
        this.code = code;
        this.subCode = subCode;
        this.operands = operands || [];
    }

    hexToBinary (hex) {
        return parseInt(hex, 16).toString(2);
    }

    match () {
        // abstract class, never match
        return false;
    }

    getBytes () {
        throw new Error(`Opcode not implmented: ${this.code}, ${this.subCode}, ${this.operands}`);
    }

    toInstructionString () {
        return this.operands.map(op => op.asInsString()).join(", ");
    }

    toOpCodeString () {
        return this.code + (this.subCode ? ` ${this.subCode}` : "") + " " +
            this.operands.filter(op => !(op instanceof FixedRegParam)).map(operand => operand.asOpString()).join(", ");
    }

    toString () {
        return this.code + (this.subCode ? ` ${this.subCode}` : "") + " " + this.operands.map(operand => operand).join(", ");
    }
}

// Encoding types:
//      -- no sub-code --
// OP           - No Parameter                      - HLT               - Done
// OP           - Fixed register/s                  - PUSH AX           - Done
// OP imm       - Immediate                         - JMP rel8          - Done
// OP imm       - Fixed register and Immediate      - ADD AX, imm16     - Done
// OP ModRM     - 2 registers - one could be memory - XOR r/m16, r16    -
//      -- sub-code --
// Op ModRM     - 1 Register/memory only            - Pop r/m16
// OP ModRM     - Fixed Segment and register/memory - MOV ES, r/m16
// OP ModRM imm - Register/memory and imm           - AND r/m16, imm16


class OpCode extends OpCodeBase {
    constructor (code, subCode, operands) {
        super(code, subCode, operands);
    }

    match (operands) {
        return operands.length === this.operands.length
            && this.operands.every((op, i) => op.match(operands[i]));
    }

    getBytes (operands) {
        // add opCode to output
        let output = this.hexToBinary(this.code);
        // add subCode to output
        if (this.subCode) {
            output += this.hexToBinary(this.subCode);
        }
        // add any immediate value to output
        this.operands.forEach((op, i) => {
            if (op instanceof ImmParam || op instanceof RelParam || op instanceof PtrParam) {
                output += operands[i].getBytes(op.bits);
            }
        });
        return output;
    }
}

class OpCodeModRM extends OpCode {
    constructor (code, subCode, operands) {
        super(code, subCode, operands);
    }

    toOpCodeString () {
        return this.code + (this.subCode ? ` /${parseInt(this.subCode,16) >> 3} ` : " /r ") +
            this.operands.filter(op => op instanceof ImmParam).map(operand => operand.asOpString()).join(", ");
    }


    getBytes (operands) {
        let output = this.hexToBinary(this.code);

        const immIndex = this.operands.findIndex(op => op instanceof ImmParam);
        const regMemIndex = this.operands.findIndex(op => op instanceof RegMemParam);
        // If we have an immediate value or just one register
        if (this.operands.length === 1 || immIndex !== -1) {
            // most likely we will have a subcode and it is encoded in the normal first reg position
            if (operands[regMemIndex] instanceof Register) {
                output += "11" + this.hexToBinary(this.subCode).substring(2, 4) + operands[regMemIndex].getBytes();
            } else {
                // TODO: handle addressing modes
            }
            // append immediate value if it exists
            if (immIndex !== -1) {
                operands[immIndex].getBytes(this.operands[immIndex].bits);
            }
        } else {
            // if the memory/register operand is just a register, use reg/reg encoding
            if (operands[regMemIndex] instanceof Register) {
                output += "11" + operands[0].getBytes() + operands[1].getBytes();
            } else {
                // TODO: handle addressing modes
            }
        }

        return output;
    }
}

export const instructions = [
    new Instruction("AAA", "ASCII adjust AL after addition",[
        new OpCode("37")
    ]),
    new Instruction("AAD", "ASCII adjust AX before division", [
        new OpCode("D5", null, [new ImmParam(8)]),
        new OpCode("D5", "0A")
    ]),
    new Instruction("AAM", "ASCII adjust AX after multiplication", [
        new OpCode("D3", null, [new ImmParam(8)])
    ]),
    new Instruction("AAS", "ASCII adjust AL after subtraction", [
        new OpCode("3F")
    ]),
    new Instruction("ADC", "Add with carry", [
        new OpCode("14", null, [new FixedRegParam("AL"), new ImmParam(8)]),
        new OpCode("15", null, [new FixedRegParam("AX"), new ImmParam(16)]),
        new OpCodeModRM("10", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("11", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("12", null, [new RegParam(8, "G"), new RegMemParam(8, "G")]),
        new OpCodeModRM("13", null, [new RegParam(16, "G"), new RegMemParam(16, "G")]),
        new OpCodeModRM("80", "10", [new RegMemParam(8, "G"), new ImmParam(8)]),
        new OpCodeModRM("83", "10", [new RegMemParam(16, "G"), new ImmParam(8)]),
        new OpCodeModRM("81", "10", [new RegMemParam(16, "G"), new ImmParam(16)])
    ]),
    new Instruction("ADD", "Add", [
        new OpCode("04", null, [new FixedRegParam("AL"), new ImmParam(8)]),
        new OpCode("05", null, [new FixedRegParam("AX"), new ImmParam(16)]),
        new OpCodeModRM("00", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("01", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("02", null, [new RegParam(8, "G"), new RegMemParam(8, "G")]),
        new OpCodeModRM("03", null, [new RegParam(16, "G"), new RegMemParam(16, "G")]),
        new OpCodeModRM("80", "00", [new RegMemParam(8, "G"), new ImmParam(8)]),
        new OpCodeModRM("83", "00", [new RegMemParam(16, "G"), new ImmParam(8)]),
        new OpCodeModRM("81", "00", [new RegMemParam(16, "G"), new ImmParam(16)])
    ]),
    new Instruction("AND", "Logical AND", [
        new OpCode("24", null, [new FixedRegParam("AL"), new ImmParam(8)]),
        new OpCode("25", null, [new FixedRegParam("AX"), new ImmParam(16)]),
        new OpCodeModRM("20", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("21", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("22", null, [new RegParam(8, "G"), new RegMemParam(8, "G")]),
        new OpCodeModRM("23", null, [new RegParam(16, "G"), new RegMemParam(16, "G")]),
        new OpCodeModRM("80", "20", [new RegMemParam(8, "G"), new ImmParam(8)]),
        new OpCodeModRM("83", "20", [new RegMemParam(16, "G"), new ImmParam(8)]),
        new OpCodeModRM("81", "20", [new RegMemParam(16, "G"), new ImmParam(16)])
    ]),
    new Instruction("CALL", "Call procedure", [
        new OpCode("E8", null, [new RelParam(16)]),
        new OpCode("9A", null, [new PtrParam(16), new PtrParam(16)])
    ]),
    new Instruction("CBW", "Convert byte to word", [
        new OpCode("98")
    ]),
    new Instruction("CLC", "Clear carry flag", [
        new OpCode("F8")
    ]),
    new Instruction("CLD", "Clear direction flag", [
        new OpCode("FC")
    ]),
    new Instruction("CLI", "Clear interrupt flag", [
        new OpCode("FA")
    ]),
    new Instruction("CMC", "Complement carry flag", [
        new OpCode("F5")
    ]),
    new Instruction("CMP", "Compare operands", [
        new OpCode("3C", null, [new FixedRegParam("AL"), new ImmParam(8)]),
        new OpCode("3D", null, [new FixedRegParam("AX"), new ImmParam(16)]),
        new OpCodeModRM("38", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("39", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("3A", null, [new RegParam(8, "G"), new RegMemParam(8, "G")]),
        new OpCodeModRM("3B", null, [new RegParam(16, "G"), new RegMemParam(16, "G")]),
        new OpCodeModRM("80", "38", [new RegMemParam(8, "G"), new ImmParam(8)]),
        new OpCodeModRM("83", "38", [new RegMemParam(16, "G"), new ImmParam(8)]),
        new OpCodeModRM("81", "38", [new RegMemParam(16, "G"), new ImmParam(16)])
    ]),
    new Instruction("CMPSB", "Compare bytes in memory", [
        new OpCode("A6")
    ]),
    new Instruction("CMPSW", "Compare words", [
        new OpCode("A7")
    ]),
    new Instruction("CWD", "Convert word to doubleword", [
        new OpCode("99")
    ]),
    new Instruction("DAA", "Decimal adjust AL after addition", [
        new OpCode("D7")
    ]),
    new Instruction("DAS", "Decimal adjust AL after subtraction", [
        new OpCode("2F")
    ]),
    new Instruction("DEC", "Decrement by 1", [
        new OpCode("48", null, [new FixedRegParam("AX")]),
        new OpCode("49", null, [new FixedRegParam("CX")]),
        new OpCode("4A", null, [new FixedRegParam("DX")]),
        new OpCode("4B", null, [new FixedRegParam("BX")]),
        new OpCode("4C", null, [new FixedRegParam("SP")]),
        new OpCode("4D", null, [new FixedRegParam("BP")]),
        new OpCode("4E", null, [new FixedRegParam("SI")]),
        new OpCode("4F", null, [new FixedRegParam("DI")]),
        new OpCodeModRM("FE", "08", [new RegMemParam(8, "G")]), // AL, AH, BL, BH, etc
        new OpCodeModRM("FF", "08", [new RegMemParam(16, "G")]) // AX, BX, etc
    ]),
    new Instruction("DIV", "Unsigned divide", [
        new OpCodeModRM("F6", "30", [new RegMemParam(8, "G")]),
        new OpCodeModRM("F7", "30", [new RegMemParam(16, "G")])
    ]),
    new Instruction("ESC", "Used with floating-point unit"),
    new Instruction("HLT", "Enter halt state", [
        new OpCode("F4")
    ]),
    new Instruction("IDIV", "Signed divide", [
        new OpCodeModRM("F6", "38", [new RegMemParam(8, "G")]),
        new OpCodeModRM("F7", "38", [new RegMemParam(16, "G")])
    ]),
    new Instruction("IMUL", "Signed multiply", [
        new OpCodeModRM("F6", "28", [new RegMemParam(8, "G")]),
        new OpCodeModRM("F7", "28", [new RegMemParam(16, "G")])
    ]),
    new Instruction("IN", "Input from port"),
    new Instruction("INC", "Increment by 1", [
        new OpCode("40", null, [new FixedRegParam("AX")]),
        new OpCode("41", null, [new FixedRegParam("CX")]),
        new OpCode("42", null, [new FixedRegParam("DX")]),
        new OpCode("43", null, [new FixedRegParam("BX")]),
        new OpCode("44", null, [new FixedRegParam("SP")]),
        new OpCode("45", null, [new FixedRegParam("BP")]),
        new OpCode("46", null, [new FixedRegParam("SI")]),
        new OpCode("47", null, [new FixedRegParam("DI")]),
        new OpCodeModRM("FE", "00", [new RegMemParam(8, "G")]), // AL, AH, BL, BH, etc
        new OpCodeModRM("FF", "00", [new RegMemParam(16, "G")]) // AX, BX, etc
    ]),
    new Instruction("INT", "Call to interrupt", [
        new OpCode("CD", null, [new ImmParam(8)])
    ]),
    new Instruction("INTO", "Call to interrupt if overflow", [
        new OpCode("CE")
    ]),
    new Instruction("IRET", "Return from interrupt", [
        new OpCode("CF")
    ]),
    new Instruction("JO", "Jump if Overflow", [
        new OpCode("70", null, [new RelParam(8)])
    ]),
    new Instruction("JNO", "Jump if Not Overflow", [
        new OpCode("71", null, [new RelParam(8)])
    ]),
    new Instruction("JB", "Jump if Below", [
        new OpCode("72", null, [new RelParam(8)])
    ]),
    new Instruction("JNAE", "Jump if Not Above or Equal", [
        new OpCode("72", null, [new RelParam(8)])
    ]),
    new Instruction("JNB", "Jump if Not Below", [
        new OpCode("73", null, [new RelParam(8)])
    ]),
    new Instruction("JAE", "Jump if Above or Equal", [
        new OpCode("73", null, [new RelParam(8)])
    ]),
    new Instruction("JE", "Jump if Equal", [
        new OpCode("74", null, [new RelParam(8)])
    ]),
    new Instruction("JZ", "Jump if Zero", [
        new OpCode("74", null, [new RelParam(8)])
    ]),
    new Instruction("JNE", "Jump if Not Equal", [
        new OpCode("75", null, [new RelParam(8)])
    ]),
    new Instruction("JNZ", "Jump if Not Zero", [
        new OpCode("75", null, [new RelParam(8)])
    ]),
    new Instruction("JBE", "Jump if Below or Equal", [
        new OpCode("76", null, [new RelParam(8)])
    ]),
    new Instruction("JNA", "Jump if Not Above", [
        new OpCode("76", null, [new RelParam(8)])
    ]),
    new Instruction("JNBE", "Jump if Not Below or Equal", [
        new OpCode("77", null, [new RelParam(8)])
    ]),
    new Instruction("JA", "Jump if Above", [
        new OpCode("77", null, [new RelParam(8)])
    ]),
    new Instruction("JS", "Jump if Sign (Negative)", [
        new OpCode("78", null, [new RelParam(8)])
    ]),
    new Instruction("JNS", "Jump if Not Sign (Positive)", [
        new OpCode("79", null, [new RelParam(8)])
    ]),
    new Instruction("JP", "Jump if Parity", [
        new OpCode("7A", null, [new RelParam(8)])
    ]),
    new Instruction("JPE", "Jump if Parity Even", [
        new OpCode("7A", null, [new RelParam(8)])
    ]),
    new Instruction("JNP", "Jump if Not Parity", [
        new OpCode("7B", null, [new RelParam(8)])
    ]),
    new Instruction("JPO", "Jump if Parity Odd", [
        new OpCode("7B", null, [new RelParam(8)])
    ]),
    new Instruction("JL", "Jump if Less", [
        new OpCode("7C", null, [new RelParam(8)])
    ]),
    new Instruction("JNGE", "Jump if Not Greater or Equal", [
        new OpCode("7C", null, [new RelParam(8)])
    ]),
    new Instruction("JNL", "Jump if Not Less", [
        new OpCode("7D", null, [new RelParam(8)])
    ]),
    new Instruction("JGE", "Jump if Greater or Equal", [
        new OpCode("7D", null, [new RelParam(8)])
    ]),
    new Instruction("JLE", "Jump if Less or Equal", [
        new OpCode("7E", null, [new RelParam(8)])
    ]),
    new Instruction("JNG", "Jump if Not Greater", [
        new OpCode("7E", null, [new RelParam(8)])
    ]),
    new Instruction("JNLE", "Jump if Not Less or Equal", [
        new OpCode("7F", null, [new RelParam(8)])
    ]),
    new Instruction("JG", "Jump if Greater", [
        new OpCode("7F", null, [new RelParam(8)])
    ]),
    new Instruction("JCXZ", "Jump if CX is zero", [
        new OpCode("E3", null, [new RelParam(8)])
    ]),
    new Instruction("JMP", "Jump", [
        new OpCode("E9", null, [new RelParam(16)]),
        new OpCode("EA", null, [new PtrParam(16), new PtrParam(16)]),
        new OpCode("EB", null, [new RelParam(8)]),
        new OpCodeModRM("FF", "20", [new RegMemParam(16, "G")])
        //new OpCodeModRM("FF", "28", [new RegMemParam(32, "G")]) // Memory 32
    ]),
    new Instruction("LAHF", "Load flags into AH register", [
        new OpCode("9F")
    ]),
    new Instruction("LDS", "Load pointer using DS"),
    new Instruction("LEA", "Load Effective Address"),
    new Instruction("LES", "Load ES with pointer"),
    new Instruction("LOCK", "Assert BUS LOCK# signal", [
        new OpCode("F0")
    ]),
    new Instruction("LODSB", "Load string byte", [
        new OpCode("AC")
    ]),
    new Instruction("LODSW", "Load string word", [
        new OpCode("AD")
    ]),
    new Instruction("LOOP", "Loop control", [
        new OpCode("E2", null, [new RelParam(8)])
    ]),
    new Instruction("LOOPZ", "Loop control and Zero", [
        new OpCode("E1", null, [new RelParam(8)])
    ]),
    new Instruction("LOOPE", "Loop control and Equal", [
        new OpCode("E1", null, [new RelParam(8)])
    ]),
    new Instruction("LOOPNZ", "Loop control and Not Zero", [
        new OpCode("E0", null, [new RelParam(8)])
    ]),
    new Instruction("LOOPNE", "Loop control and Not Equal", [
        new OpCode("E0", null, [new RelParam(8)])
    ]),
    new Instruction("MOV", "Move", [
        new OpCode("B0", null, [new FixedRegParam("AL"), new ImmParam(8)]),
        new OpCode("B1", null, [new FixedRegParam("CL"), new ImmParam(8)]),
        new OpCode("B2", null, [new FixedRegParam("DL"), new ImmParam(8)]),
        new OpCode("B3", null, [new FixedRegParam("BL"), new ImmParam(8)]),
        new OpCode("B4", null, [new FixedRegParam("AH"), new ImmParam(8)]),
        new OpCode("B5", null, [new FixedRegParam("CH"), new ImmParam(8)]),
        new OpCode("B6", null, [new FixedRegParam("DH"), new ImmParam(8)]),
        new OpCode("B7", null, [new FixedRegParam("BH"), new ImmParam(8)]),
        new OpCode("B8", null, [new FixedRegParam("AX"), new ImmParam(16)]),
        new OpCode("B9", null, [new FixedRegParam("CX"), new ImmParam(16)]),
        new OpCode("BA", null, [new FixedRegParam("DX"), new ImmParam(16)]),
        new OpCode("BB", null, [new FixedRegParam("BX"), new ImmParam(16)]),
        new OpCode("BC", null, [new FixedRegParam("SP"), new ImmParam(16)]),
        new OpCode("BD", null, [new FixedRegParam("BP"), new ImmParam(16)]),
        new OpCode("BE", null, [new FixedRegParam("SI"), new ImmParam(16)]),
        new OpCode("BF", null, [new FixedRegParam("DI"), new ImmParam(16)]),
        new OpCodeModRM("88", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("89", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("8A", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("8B", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("8C", null, [new RegMemParam(16, "G"), new RegParam(16, "S")]),
        new OpCodeModRM("8E", null, [new RegParam(16, "S"), new RegMemParam(16, "G")]),
        new OpCodeModRM("C6", "00", [new RegMemParam(8, "G"), new ImmParam(8)]),
        new OpCodeModRM("C7", "00", [new RegMemParam(8, "G"), new ImmParam(8)])
    ]),
    new Instruction("MOVSB", "Move byte from string to string", [
        new OpCode("A4")
    ]),
    new Instruction("MOVSW", "Move word from string to string", [
        new OpCode("A5")
    ]),
    new Instruction("MUL", "Unsigned multiply", [
        new OpCodeModRM("F6", "20", [new RegMemParam(8, "G")]),
        new OpCodeModRM("F7", "20", [new RegMemParam(16, "G")])
    ]),
    new Instruction("NEG", "Two's complement negation", [
        new OpCodeModRM("F6", "18", [new RegMemParam(8, "G")]),
        new OpCodeModRM("F7", "18", [new RegMemParam(16, "G")])
    ]),
    new Instruction("NOP", "No operation", [
        new OpCode("90", null)
    ]),
    new Instruction("NOT", "Negate the operand, logical NOT", [
        new OpCodeModRM("F6", "10", [new RegMemParam(8, "G")]),
        new OpCodeModRM("F7", "10", [new RegMemParam(16, "G")])
    ]),
    new Instruction("OR", "Logical OR", [
        new OpCode("0C", null, [new FixedRegParam("AL"), new ImmParam(8)]),
        new OpCode("0D", null, [new FixedRegParam("AX"), new ImmParam(16)]),
        new OpCodeModRM("08", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("09", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("0A", null, [new RegParam(8, "G"), new RegMemParam(8, "G")]),
        new OpCodeModRM("0B", null, [new RegParam(16, "G"), new RegMemParam(16, "G")]),
        new OpCodeModRM("80", "08", [new RegMemParam(8, "G"), new ImmParam(8)]),
        new OpCodeModRM("83", "08", [new RegMemParam(16, "G"), new ImmParam(8)]),
        new OpCodeModRM("81", "08", [new RegMemParam(16, "G"), new ImmParam(16)])
    ]),
    new Instruction("OUT", "Output to port"),
    new Instruction("POP", "Pop data from stack", [
        new OpCode("58", null, [new FixedRegParam("AX")]),
        new OpCode("59", null, [new FixedRegParam("CX")]),
        new OpCode("5A", null, [new FixedRegParam("DX")]),
        new OpCode("5B", null, [new FixedRegParam("BX")]),
        new OpCode("5C", null, [new FixedRegParam("SP")]),
        new OpCode("5D", null, [new FixedRegParam("BP")]),
        new OpCode("5E", null, [new FixedRegParam("SI")]),
        new OpCode("5F", null, [new FixedRegParam("DI")]),
        new OpCode("06", null, [new FixedRegParam("ES")]),
        new OpCode("0F", null, [new FixedRegParam("CS")]),
        new OpCode("17", null, [new FixedRegParam("SS")]),
        new OpCode("1F", null, [new FixedRegParam("DS")]),
        new OpCodeModRM("8F", "00", [new RegMemParam(16, "G")]) // AX, BX, etc
    ]),
    new Instruction("POPF", "Pop data from flags register", [
        new OpCode("9D")
    ]),
    new Instruction("PUSH", "Push data onto stack", [
        new OpCode("50", null, [new FixedRegParam("AX")]),
        new OpCode("51", null, [new FixedRegParam("CX")]),
        new OpCode("52", null, [new FixedRegParam("DX")]),
        new OpCode("53", null, [new FixedRegParam("BX")]),
        new OpCode("54", null, [new FixedRegParam("SP")]),
        new OpCode("55", null, [new FixedRegParam("BP")]),
        new OpCode("56", null, [new FixedRegParam("SI")]),
        new OpCode("57", null, [new FixedRegParam("DI")]),
        new OpCode("06", null, [new FixedRegParam("ES")]),
        new OpCode("0E", null, [new FixedRegParam("CS")]),
        new OpCode("16", null, [new FixedRegParam("SS")]),
        new OpCode("1E", null, [new FixedRegParam("DS")]),
        new OpCodeModRM("FF", "30", [new RegMemParam(16, "G")]) // AX, BX, etc
    ]),
    new Instruction("PUSHF", "Push flags onto stack", [
        new OpCode("9C")
    ]),
    new Instruction("RCL", "Rotate left (with carry)", [
        new OpCodeModRM("D0", "10", [new RegMemParam(8), new FixedImmParam(1)]),
        new OpCodeModRM("D1", "10", [new RegMemParam(16), new FixedImmParam(1)]),
        new OpCodeModRM("D2", "10", [new RegMemParam(8), new FixedRegParam("CL")]),
        new OpCodeModRM("D3", "10", [new RegMemParam(16), new FixedImmParam("CL")])
    ]),
    new Instruction("RCR", "Rotate right (with carry)", [
        new OpCodeModRM("D0", "18", [new RegMemParam(8), new FixedImmParam(1)]),
        new OpCodeModRM("D1", "18", [new RegMemParam(16), new FixedImmParam(1)]),
        new OpCodeModRM("D2", "18", [new RegMemParam(8), new FixedRegParam("CL")]),
        new OpCodeModRM("D3", "18", [new RegMemParam(16), new FixedImmParam("CL")])
    ]),
    new Instruction("RET", "Return from procedure", [
        new OpCode("C2", null, [new ImmParam(16)]),
        new OpCode("C3")
    ]),
    new Instruction("RETN", "Return from near procedure", [
        new OpCode("C2", null, [new ImmParam(16)]),
        new OpCode("C3")
    ]),
    new Instruction("RETF", "Return from far procedure", [
        new OpCode("CA", null, [new ImmParam(16)]),
        new OpCode("CB")
    ]),
    new Instruction("ROL", "Rotate left", [
        new OpCodeModRM("D0", "00", [new RegMemParam(8), new FixedImmParam(1)]),
        new OpCodeModRM("D1", "00", [new RegMemParam(16), new FixedImmParam(1)]),
        new OpCodeModRM("D2", "00", [new RegMemParam(8), new FixedRegParam("CL")]),
        new OpCodeModRM("D3", "00", [new RegMemParam(16), new FixedImmParam("CL")])
    ]),
    new Instruction("ROR", "Rotate right", [
        new OpCodeModRM("D0", "08", [new RegMemParam(8), new FixedImmParam(1)]),
        new OpCodeModRM("D1", "08", [new RegMemParam(16), new FixedImmParam(1)]),
        new OpCodeModRM("D2", "08", [new RegMemParam(8), new FixedRegParam("CL")]),
        new OpCodeModRM("D3", "08", [new RegMemParam(16), new FixedImmParam("CL")])
    ]),
    new Instruction("SAHF", "Store AH into flags", [
        new OpCode("9E")
    ]),
    new Instruction("SAL", "Shift Arithmetically left (signed shift left)", [
        new OpCodeModRM("D0", "20", [new RegMemParam(8), new FixedImmParam(1)]),
        new OpCodeModRM("D1", "20", [new RegMemParam(16), new FixedImmParam(1)]),
        new OpCodeModRM("D2", "20", [new RegMemParam(8), new FixedRegParam("CL")]),
        new OpCodeModRM("D3", "20", [new RegMemParam(16), new FixedImmParam("CL")])
    ]),
    new Instruction("SAR", "Shift Arithmetically right (signed shift right)", [
        new OpCodeModRM("D0", "38", [new RegMemParam(8), new FixedImmParam(1)]),
        new OpCodeModRM("D1", "38", [new RegMemParam(16), new FixedImmParam(1)]),
        new OpCodeModRM("D2", "38", [new RegMemParam(8), new FixedRegParam("CL")]),
        new OpCodeModRM("D3", "38", [new RegMemParam(16), new FixedImmParam("CL")])
    ]),
    new Instruction("SBB", "Subtraction with borrow", [
        new OpCode("1C", null, [new FixedRegParam("AL"), new ImmParam(8)]),
        new OpCode("1D", null, [new FixedRegParam("AX"), new ImmParam(16)]),
        new OpCodeModRM("18", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("19", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("1A", null, [new RegParam(8, "G"), new RegMemParam(8, "G")]),
        new OpCodeModRM("1B", null, [new RegParam(16, "G"), new RegMemParam(16, "G")]),
        new OpCodeModRM("80", "18", [new RegMemParam(8, "G"), new ImmParam(8)]),
        new OpCodeModRM("83", "18", [new RegMemParam(16, "G"), new ImmParam(8)]),
        new OpCodeModRM("81", "18", [new RegMemParam(16, "G"), new ImmParam(16)])
    ]),
    new Instruction("SCASB", "Compare byte string", [
        new OpCode("AE")
    ]),
    new Instruction("SCASW", "Compare word string", [
        new OpCode("AF")
    ]),
    new Instruction("SHL", "Shift left (unsigned shift left)", [
        new OpCodeModRM("D0", "20", [new RegMemParam(8), new FixedImmParam(1)]),
        new OpCodeModRM("D1", "20", [new RegMemParam(16), new FixedImmParam(1)]),
        new OpCodeModRM("D2", "20", [new RegMemParam(8), new FixedRegParam("CL")]),
        new OpCodeModRM("D3", "20", [new RegMemParam(16), new FixedImmParam("CL")])
    ]),
    new Instruction("SHR", "Shift right (unsigned shift right)", [
        new OpCodeModRM("D0", "28", [new RegMemParam(8), new FixedImmParam(1)]),
        new OpCodeModRM("D1", "28", [new RegMemParam(16), new FixedImmParam(1)]),
        new OpCodeModRM("D2", "28", [new RegMemParam(8), new FixedRegParam("CL")]),
        new OpCodeModRM("D3", "28", [new RegMemParam(16), new FixedImmParam("CL")])
    ]),
    new Instruction("STC", "Set carry flag", [
        new OpCode("F9")
    ]),
    new Instruction("STD", "Set direction flag", [
        new OpCode("FD")
    ]),
    new Instruction("STI", "Set interrupt flag", [
        new OpCode("FB")
    ]),
    new Instruction("STOSB", "Store byte in string", [
        new OpCode("AA")
    ]),
    new Instruction("STOSW", "Store word in string", [
        new OpCode("AB")
    ]),
    new Instruction("SUB", "Subtraction", [
        new OpCode("2C", null, [new FixedRegParam("AL"), new ImmParam(8)]),
        new OpCode("2D", null, [new FixedRegParam("AX"), new ImmParam(16)]),
        new OpCodeModRM("28", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("29", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("2A", null, [new RegParam(8, "G"), new RegMemParam(8, "G")]),
        new OpCodeModRM("2B", null, [new RegParam(16, "G"), new RegMemParam(16, "G")]),
        new OpCodeModRM("80", "28", [new RegMemParam(8, "G"), new ImmParam(8)]),
        new OpCodeModRM("83", "28", [new RegMemParam(16, "G"), new ImmParam(8)]),
        new OpCodeModRM("81", "28", [new RegMemParam(16, "G"), new ImmParam(16)])
    ]),
    new Instruction("TEST", "Logical compare (AND)", [
        new OpCode("A8", null, [new FixedRegParam("AL"), new ImmParam(8)]),
        new OpCode("A9", null, [new FixedRegParam("AX"), new ImmParam(16)]),
        new OpCodeModRM("84", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("84", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("F6", "00", [new RegMemParam(8, "G"), new ImmParam(8)]),
        new OpCodeModRM("F7", "00", [new RegMemParam(16, "G"), new ImmParam(16)])
    ]),
    new Instruction("WAIT", "Wait until not busy", [
        new OpCode("9B")
    ]),
    new Instruction("XCHG", "Exchange data", [
        new OpCode("91", null, [new FixedRegParam("AX"), new FixedRegParam("CX")]),
        new OpCode("92", null, [new FixedRegParam("AX"), new FixedRegParam("DX")]),
        new OpCode("93", null, [new FixedRegParam("AX"), new FixedRegParam("BX")]),
        new OpCode("94", null, [new FixedRegParam("AX"), new FixedRegParam("SP")]),
        new OpCode("95", null, [new FixedRegParam("AX"), new FixedRegParam("BP")]),
        new OpCode("96", null, [new FixedRegParam("AX"), new FixedRegParam("SI")]),
        new OpCode("97", null, [new FixedRegParam("AX"), new FixedRegParam("DI")]),
        new OpCodeModRM("86", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("87", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
    ]),
    new Instruction("XLAT", "Table look-up translation", [
        new OpCode("D7")
    ]),
    new Instruction("XOR", "Exclusive OR", [
        new OpCode("34", null, [new FixedRegParam("AL"), new ImmParam(8)]),
        new OpCode("35", null, [new FixedRegParam("AX"), new ImmParam(16)]),
        new OpCodeModRM("30", null, [new RegMemParam(8, "G"), new RegParam(8, "G")]),
        new OpCodeModRM("31", null, [new RegMemParam(16, "G"), new RegParam(16, "G")]),
        new OpCodeModRM("32", null, [new RegParam(8, "G"), new RegMemParam(8, "G")]),
        new OpCodeModRM("33", null, [new RegParam(16, "G"), new RegMemParam(16, "G")]),
        new OpCodeModRM("80", "30", [new RegMemParam(8, "G"), new ImmParam(8)]),
        new OpCodeModRM("83", "30", [new RegMemParam(16, "G"), new ImmParam(8)]),
        new OpCodeModRM("81", "30", [new RegMemParam(16, "G"), new ImmParam(16)])
    ])
];

"use strict";

import {Register, reg} from "./register";
import {Immediate} from "./immediate";

export class Instruction {
    constructor (instruction, name, opcodes) {
        this.key = instruction;
        this.name = name;
        this.opcodes = opcodes;
        this.type = "INSTRUCTION";
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


class OpCode {
    /**
     * Base class of OpCodes
     *
     * @param {string} code Hex Code of Instruction
     * @param {int} size Bit size operated on
     * @param {[]} operands Array of operand types [R, M, I]
     */
    constructor (code, size, operands) {
        this.code = code;
        this.size = size;
        this.operands = operands;
    }

    hexToBinary (hex) {
        return parseInt(hex, 16).toString(2);
    }

    validRegister(size, type, operand) {
        return operand instanceof Register
            && operand.bits === size
            && operand.types.includes(type);
    }

    match () {
        // abstract class, never match
        return false;
    }

    getBytes () {
        throw new Error(`Opcode not implmented: ${this.code}, ${this.size}, ${this.operands}`);
    }
}

class OpCodeOnly extends OpCode {
    /**
     * OpCodes that don't take a parameter
     *
     * @param {string} code Hex Code on Instruction
     */
    constructor (code) {
        super(code, null, []);
    }

    match (operands) {
        return operands.length === 0;
    }

    getBytes () {
        return this.hexToBinary(this.code);
    }
}

class OpCodeWithReg extends OpCode {
    /**
     * OpCodes that take a specific register as a parameter
     *
     * @param {string} code Hex Code of the Instruction
     * @param {Register} register Specific register expected
     */
    constructor (code, register) {
        const size = register.bits;
        const operand = [register.key];
        super(code, size, operand);

        this.register = register;
    }

    match (operands) {
        return operands.length === 1 && operands[0] instanceof Register && operands[0].key === this.register.key;
    }

    getBytes () {
        return this.hexToBinary(this.code);
    }
}

class OpCodeWithImm extends OpCode {
    /**
     * OpCodes that take an immediate as a parameter
     *
     * @param {string} code Hex Code of the Instruction
     * @param {int} size Bit size of immediate
     */
    constructor (code, size, count) {
        const operands = [];
        for (let i = 0; i < (count || 1); i++) {
            operands.push("I");
        }
        super(code, size, operands);

        this.count = count || 1;
    }

    match (operands) {
        return operands.length === this.count
            && operands.find((op) => !(op instanceof Immediate && op.bits <= this.size)) === undefined;
    }

    getBytes (operands) {
        return this.hexToBinary(this.code) + operands[0].getBytes(this.size);
    }
}

class OpCodeWithRegAndImm extends OpCode {
    /**
     * OpCodes that take a specific register and immediate value as parameters
     *
     * @param {string} code Hex Code of the Instruction
     * @param {Register} register Specific register expected
     */
    constructor (code, register) {
        const size = register.bits;
        const operand = [register.key];
        super(code, size, operand);

        this.register = register;
    }

    match (operands) {
        return operands.length === 2
            && operands[0] instanceof Register && operands[0].key === this.register.key
            && operands[1] instanceof Immediate && operands[1].bits <= this.register.bits;
    }

    getBytes (operands) {
        return this.hexToBinary(this.code) + operands[1].getBytes(this.register.bits);
    }
}

class OpCodeWithModRM extends OpCode {
    /**
     * OpCodes that can take two registers with the second operand optionally a memory lookup
     *
     * @param {string} code Hex Code of the Instruction
     * @param {int} size Bit size operated on
     * @param {[]} operands Array of operand types [R, R/M]
     *
     * Memory addressing is ignored for now.
     */
    constructor (code, size, operands) {
        super(code, size, operands);
    }

    match (operands) {
        return this.operands.length === operands.length
            && this.validRegister(this.size, this.operands[0], operands[0])
            && this.validRegister(this.size, this.operands[1], operands[1]);
    }

    getBytes (operands) {
        // "11" implies two registers
        return this.hexToBinary(this.code) + "11" + operands[0].getBytes() + operands[1].getBytes();
    }
}

class OpCodeWithModMR extends OpCode {
    /**
     * OpCodes that can take two registers with the first operand optionally a memory lookup
     *
     * @param {string} code Hex Code of the Instruction
     * @param {int} size Bit size operated on
     * @param {[]} operands Array of operand types [R/M, R]
     *
     * Memory addressing is ignored for now.
     */
    constructor (code, size, operands) {
        super(code, size, operands);
    }

    match (operands) {
        return this.operands.length === operands.length
            && this.validRegister(this.size, this.operands[0], operands[0])
            && this.validRegister(this.size, this.operands[1], operands[1]);
    }

    getBytes (operands) {
        // "11" implies two registers
        return this.hexToBinary(this.code) + "11" + operands[0].getBytes() + operands[1].getBytes();
    }
}

class OpCodeWithModSM extends OpCode {
    /**
     * OpCodes that can take two registers with the second operand optionally a memory lookup
     *
     * @param {string} code Hex Code of the Instruction
     * @param {int} size Bit size operated on
     * @param {[]} operands Array of operand types [R, R/M]
     *
     * Memory addressing is ignored for now.
     */
    constructor (code, size, operands) {
        super(code, size, operands);
    }

    match (operands) {
        return this.operands.length === operands.length
            && this.validRegister(this.size, this.operands[0], operands[0])
            && this.validRegister(this.size, this.operands[1], operands[1]);
    }

    getBytes (operands) {
        // "11" implies two registers
        return this.hexToBinary(this.code) + "110" + operands[0].getBytes() + operands[1].getBytes();
    }
}

class OpCodeWithModMS extends OpCode {
    /**
     * OpCodes that can take two registers with the first operand optionally a memory lookup
     *
     * @param {string} code Hex Code of the Instruction
     * @param {int} size Bit size operated on
     * @param {[]} operands Array of operand types [R/M, R]
     *
     * Memory addressing is ignored for now.
     */
    constructor (code, size, operands) {
        super(code, size, operands);
    }

    match (operands) {
        return this.operands.length === operands.length
            && this.validRegister(this.size, this.operands[0], operands[0])
            && this.validRegister(this.size, this.operands[1], operands[1]);
    }

    getBytes (operands) {
        // "11" implies two registers
        return this.hexToBinary(this.code) + "11" + operands[0].getBytes() + "0" + operands[1].getBytes();
    }
}

class OpCodeWithModMI extends OpCode {
    /**
     * OpCodes that can take a register and immediate with the first operand optionally a memory lookup
     *
     * In these instructions the 3 bits which would be used by a second register id are used as part of
     * the instruction decoding, we need to XOR this with the byte created by the memory/register marker
     *
     * XX000000 - Addressing or register selector
     * 00XXX000 - Instruction sub opcode
     * 00000XXX - Register selection
     *
     * @param {string} code Hex Code of the Instruction
     * @param {string} subCode Hex Code of sub Instruction
     * @param {int} size Bit size operated on
     * @param {[]} operands Array of operand types [R/M, I]
     *
     * Memory addressing is ignored for now.
     */
    constructor (code, subCode, size, operands) {
        super(code, size, operands);

        this.subCode = subCode;
    }

    match (operands) {
        return this.operands.length === operands.length
            && this.validRegister(this.size, this.operands[0], operands[0])
            && operands[1] instanceof Immediate && operands[0].bits <= this.size;
    }

    getBytes (operands) {
        // Special ModR/M mapping, "11" implies two registers
        return this.hexToBinary(this.code)
            + "11"
            + this.hexToBinary(this.subCode).substring(2, 4)
            + operands[0].getBytes()
            + operands[1].getBytes(this.size);
    }
}

class OpCodeWithModM extends OpCode {
    /**
     * TODO: merge with OpCodeWithModMR
     *
     * OpCodes that can take a register, with the first operand optionally a memory lookup
     *
     * In these instructions the 3 bits which would be used by a second register id are used as part of
     * the instruction decoding, we need to XOR this with the byte created by the memory/register marker
     *
     * XX000000 - Addressing or register selector
     * 00XXX000 - Instruction sub opcode
     * 00000XXX - Register selection
     *
     * @param {string} code Hex Code of the Instruction
     * @param {string} subCode Hex Code of sub Instruction
     * @param {int} size Bit size operated on
     * @param {[]} operands Array of operand types [R/M, I]
     *
     * Memory addressing is ignored for now.
     */
    constructor (code, subCode, size, operands) {
        super(code, size, operands);

        this.subCode = subCode;
    }

    match (operands) {
        return this.operands.length === operands.length
            && this.validRegister(this.size, this.operands[0], operands[0]);
    }

    getBytes (operands) {
        // Special ModR/M mapping, "11" implies two registers
        return this.hexToBinary(this.code)
            + "11"
            + this.hexToBinary(this.subCode).substring(2, 4)
            + operands[0].getBytes();
    }
}

export const instructions = [
    new Instruction("AAA", "ASCII adjust AL after addition",[
        new OpCodeOnly("37")
    ]),
    new Instruction("AAD", "ASCII adjust AX before division", [
        new OpCodeWithImm("D5", 8, 1)
    ]),
    new Instruction("AAM", "ASCII adjust AX after multiplication", [
        new OpCodeWithImm("D3", 8, 1)
    ]),
    new Instruction("AAS", "ASCII adjust AL after subtraction", [
        new OpCodeOnly("3F")
    ]),
    new Instruction("ADC", "Add with carry", [
        new OpCodeWithRegAndImm("14", reg("AL")),
        new OpCodeWithRegAndImm("15", reg("AX")),
        new OpCodeWithModMR("10", 8, ["G", "G"]),
        new OpCodeWithModMR("11", 16, ["G", "G"]),
        new OpCodeWithModRM("12", 8, ["G", "G"]),
        new OpCodeWithModRM("13", 16, ["G", "G"]),
        new OpCodeWithModMI("80", "10", 8, ["G", "I"]),
        new OpCodeWithModMI("81", "10", 16, ["G", "I"])
        // TODO support mismatched operand sizes (sign extend)
        //new OpCodeWithModMI("83", "10", [16, 8], ["G", "I"]),
    ]),
    new Instruction("ADD", "Add", [
        new OpCodeWithRegAndImm("04", reg("AL")),
        new OpCodeWithRegAndImm("05", reg("AX")),
        new OpCodeWithModMR("00", 8, ["G", "G"]),
        new OpCodeWithModMR("01", 16, ["G", "G"]),
        new OpCodeWithModRM("02", 8, ["G", "G"]),
        new OpCodeWithModRM("03", 16, ["G", "G"]),
        new OpCodeWithModMI("80", "00", 8, ["G", "I"]),
        new OpCodeWithModMI("81", "00", 16, ["G", "I"])
        // TODO support mismatched operand sizes (sign extend)
        //new OpCodeWithModMI("83", "00", [16, 8], ["G", "I"]),
    ]),
    new Instruction("AND", "Logical AND", [
        new OpCodeWithRegAndImm("24", reg("AL")),
        new OpCodeWithRegAndImm("25", reg("AX")),
        new OpCodeWithModMR("20", 8, ["G", "G"]),
        new OpCodeWithModMR("21", 16, ["G", "G"]),
        new OpCodeWithModRM("22", 8, ["G", "G"]),
        new OpCodeWithModRM("23", 16, ["G", "G"]),
        new OpCodeWithModMI("80", "20", 8, ["G", "I"]),
        new OpCodeWithModMI("81", "20", 16, ["G", "I"])
        // TODO support mismatched operand sizes (sign extend)
        //new OpCodeWithModMI("83", "20", [16, 8], ["G", "I"]),
    ]),
    new Instruction("CALL", "Call procedure", [
        new OpCodeWithImm("E8", 16),
        new OpCodeWithImm("9A", 16, 2)
    ]),
    new Instruction("CBW", "Convert byte to word", [
        new OpCodeOnly("98")
    ]),
    new Instruction("CLC", "Clear carry flag", [
        new OpCodeOnly("F8")
    ]),
    new Instruction("CLD", "Clear direction flag", [
        new OpCodeOnly("FC")
    ]),
    new Instruction("CLI", "Clear interrupt flag", [
        new OpCodeOnly("FA")
    ]),
    new Instruction("CMC", "Complement carry flag", [
        new OpCodeOnly("F5")
    ]),
    new Instruction("CMP", "Compare operands", [
        new OpCodeWithRegAndImm("3C", reg("AL")),
        new OpCodeWithRegAndImm("3D", reg("AX")),
        new OpCodeWithModMR("38", 8, ["G", "G"]),
        new OpCodeWithModMR("39", 16, ["G", "G"]),
        new OpCodeWithModRM("3A", 8, ["G", "G"]),
        new OpCodeWithModRM("3B", 16, ["G", "G"]),
        new OpCodeWithModMI("80", "38", 8, ["G", "I"]),
        new OpCodeWithModMI("81", "38", 16, ["G", "I"])
        // TODO support mismatched operand sizes (sign extend)
        //new OpCodeWithModMI("83", "38", [16, 8], ["G", "I"]),
    ]),
    new Instruction("CMPSB", "Compare bytes in memory", [
        new OpCodeOnly("A6")
    ]),
    new Instruction("CMPSW", "Compare words", [
        new OpCodeOnly("A7")
    ]),
    new Instruction("CWD", "Convert word to doubleword", [
        new OpCodeOnly("99")
    ]),
    new Instruction("DAA", "Decimal adjust AL after addition", [
        new OpCodeOnly("D7")
    ]),
    new Instruction("DAS", "Decimal adjust AL after subtraction", [
        new OpCodeOnly("2F")
    ]),
    new Instruction("DEC", "Decrement by 1", [
        new OpCodeWithReg("48", reg("AX")),
        new OpCodeWithReg("49", reg("CX")),
        new OpCodeWithReg("4A", reg("DX")),
        new OpCodeWithReg("4B", reg("BX")),
        new OpCodeWithReg("4C", reg("SP")),
        new OpCodeWithReg("4D", reg("BP")),
        new OpCodeWithReg("4E", reg("SI")),
        new OpCodeWithReg("4F", reg("DI")),
        new OpCodeWithModM("FE", "08", 8, ["G"]), // AL, AH, BL, BH, etc
        new OpCodeWithModM("FF", "08", 16, ["G"]) // AX, BX, etc
    ]),
    new Instruction("DIV", "Unsigned divide"),
    new Instruction("ESC", "Used with floating-point unit"),
    new Instruction("HLT", "Enter halt state", [
        new OpCodeOnly("F4")
    ]),
    new Instruction("IDIV", "Signed divide"),
    new Instruction("IMUL", "Signed multiply"),
    new Instruction("IN", "Input from port"),
    new Instruction("INC", "Increment by 1", [
        new OpCodeWithReg("40", reg("AX")),
        new OpCodeWithReg("41", reg("CX")),
        new OpCodeWithReg("42", reg("DX")),
        new OpCodeWithReg("43", reg("BX")),
        new OpCodeWithReg("44", reg("SP")),
        new OpCodeWithReg("45", reg("BP")),
        new OpCodeWithReg("46", reg("SI")),
        new OpCodeWithReg("47", reg("DI")),
        new OpCodeWithModM("FE", "00", 8, ["G"]), // AL, AH, BL, BH, etc
        new OpCodeWithModM("FF", "00", 16, ["G"]) // AX, BX, etc
    ]),
    new Instruction("INT", "Call to interrupt", [
        new OpCodeWithImm("CD", 8)
    ]),
    new Instruction("INTO", "Call to interrupt if overflow", [
        new OpCodeOnly("CE")
    ]),
    new Instruction("IRET", "Return from interrupt", [
        new OpCodeOnly("CF")
    ]),
    new Instruction("JO", "Jump if Overflow", [
        new OpCodeWithImm("70", 8, 1)
    ]),
    new Instruction("JNO", "Jump if Not Overflow", [
        new OpCodeWithImm("71", 8, 1)
    ]),
    new Instruction("JB", "Jump if Below", [
        new OpCodeWithImm("72", 8, 1)
    ]),
    new Instruction("JNAE", "Jump if Not Above or Equal", [
        new OpCodeWithImm("72", 8, 1)
    ]),
    new Instruction("JNB", "Jump if Not Below", [
        new OpCodeWithImm("73", 8, 1)
    ]),
    new Instruction("JAE", "Jump if Above or Equal", [
        new OpCodeWithImm("73", 8, 1)
    ]),
    new Instruction("JE", "Jump if Equal", [
        new OpCodeWithImm("74", 8, 1)
    ]),
    new Instruction("JZ", "Jump if Zero", [
        new OpCodeWithImm("74", 8, 1)
    ]),
    new Instruction("JNE", "Jump if Not Equal", [
        new OpCodeWithImm("75", 8, 1)
    ]),
    new Instruction("JNZ", "Jump if Not Zero", [
        new OpCodeWithImm("75", 8, 1)
    ]),
    new Instruction("JBE", "Jump if Below or Equal", [
        new OpCodeWithImm("76", 8, 1)
    ]),
    new Instruction("JNA", "Jump if Not Above", [
        new OpCodeWithImm("76", 8, 1)
    ]),
    new Instruction("JNBE", "Jump if Not Below or Equal", [
        new OpCodeWithImm("77", 8, 1)
    ]),
    new Instruction("JA", "Jump if Above", [
        new OpCodeWithImm("77", 8, 1)
    ]),
    new Instruction("JS", "Jump if Sign (Negative)", [
        new OpCodeWithImm("78", 8, 1)
    ]),
    new Instruction("JNS", "Jump if Not Sign (Positive)", [
        new OpCodeWithImm("79", 8, 1)
    ]),
    new Instruction("JP", "Jump if Parity", [
        new OpCodeWithImm("7A", 8, 1)
    ]),
    new Instruction("JPE", "Jump if Parity Even", [
        new OpCodeWithImm("7A", 8, 1)
    ]),
    new Instruction("JNP", "Jump if Not Parity", [
        new OpCodeWithImm("7B", 8, 1)
    ]),
    new Instruction("JPO", "Jump if Parity Odd", [
        new OpCodeWithImm("7B", 8, 1)
    ]),
    new Instruction("JL", "Jump if Less", [
        new OpCodeWithImm("7C", 8, 1)
    ]),
    new Instruction("JNGE", "Jump if Not Greater or Equal", [
        new OpCodeWithImm("7C", 8, 1)
    ]),
    new Instruction("JNL", "Jump if Not Less", [
        new OpCodeWithImm("7D", 8, 1)
    ]),
    new Instruction("JGE", "Jump if Greater or Equal", [
        new OpCodeWithImm("7D", 8, 1)
    ]),
    new Instruction("JLE", "Jump if Less or Equal", [
        new OpCodeWithImm("7E", 8, 1)
    ]),
    new Instruction("JNG", "Jump if Not Greater", [
        new OpCodeWithImm("7E", 8, 1)
    ]),
    new Instruction("JNLE", "Jump if Not Less or Equal", [
        new OpCodeWithImm("7F", 8, 1)
    ]),
    new Instruction("JG", "Jump if Greater", [
        new OpCodeWithImm("7F", 8, 1)
    ]),
    // new Instruction("JC", "Jump if Carry Flag Set"),
    // new Instruction("JNC", "Jump if Carry Flag Not Set"),
    new Instruction("JCXZ", "Jump if CX is zero", [
        new OpCodeWithImm("E3", 8, 1)
    ]),
    new Instruction("JMP", "Jump", [
        new OpCodeWithImm("E9", 16, 1),
        new OpCodeWithImm("EA", 16, 2),
        new OpCodeWithImm("EB", 8, 1)
    ]),
    new Instruction("LAHF", "Load flags into AH register", [
        new OpCodeOnly("9F")
    ]),
    new Instruction("LDS", "Load pointer using DS"),
    new Instruction("LEA", "Load Effective Address"),
    new Instruction("LES", "Load ES with pointer"),
    new Instruction("LOCK", "Assert BUS LOCK# signal", [
        new OpCodeOnly("F0")
    ]),
    new Instruction("LODSB", "Load string byte", [
        new OpCodeOnly("AC")
    ]),
    new Instruction("LODSW", "Load string word", [
        new OpCodeOnly("AD")
    ]),
    new Instruction("LOOP", "Loop control", [
        new OpCodeWithImm("E2", 8, 1)
    ]),
    new Instruction("LOOPZ", "Loop control and Zero", [
        new OpCodeWithImm("E1", 8, 1)
    ]),
    new Instruction("LOOPE", "Loop control and Equal", [
        new OpCodeWithImm("E1", 8, 1)
    ]),
    new Instruction("LOOPNZ", "Loop control and Not Zero", [
        new OpCodeWithImm("E0", 8, 1)
    ]),
    new Instruction("LOOPNE", "Loop control and Not Equal", [
        new OpCodeWithImm("E0", 8, 1)
    ]),
    new Instruction("MOV", "Move", [
        new OpCodeWithRegAndImm("B0", reg("AL")),
        new OpCodeWithRegAndImm("B1", reg("CL")),
        new OpCodeWithRegAndImm("B2", reg("DL")),
        new OpCodeWithRegAndImm("B3", reg("BL")),
        new OpCodeWithRegAndImm("B4", reg("AH")),
        new OpCodeWithRegAndImm("B5", reg("CH")),
        new OpCodeWithRegAndImm("B6", reg("DH")),
        new OpCodeWithRegAndImm("B7", reg("BH")),
        new OpCodeWithRegAndImm("B8", reg("AX")),
        new OpCodeWithRegAndImm("B9", reg("CX")),
        new OpCodeWithRegAndImm("BA", reg("DX")),
        new OpCodeWithRegAndImm("BB", reg("BX")),
        new OpCodeWithRegAndImm("BC", reg("SP")),
        new OpCodeWithRegAndImm("BD", reg("BP")),
        new OpCodeWithRegAndImm("BE", reg("SI")),
        new OpCodeWithRegAndImm("BF", reg("DI")),
        new OpCodeWithModMR("88", 8, ["G", "G"]),
        new OpCodeWithModMR("89", 16, ["G", "G"]),
        new OpCodeWithModMR("8A", 8, ["G", "G"]),
        new OpCodeWithModMR("8B", 16, ["G", "G"]),
        new OpCodeWithModMS("8C", 16, ["G", "S"]),
        new OpCodeWithModSM("8E", 16, ["S", "G"]),
        new OpCodeWithModMI("C6", "00", 8, ["G", "I"]),
        new OpCodeWithModMI("C7", "00", 8, ["G", "I"])
    ]),
    new Instruction("MOVSB", "Move byte from string to string", [
        new OpCodeOnly("A4")
    ]),
    new Instruction("MOVSW", "Move word from string to string", [
        new OpCodeOnly("A5")
    ]),
    new Instruction("MUL", "Unsigned multiply"),
    new Instruction("NEG", "Two's complement negation"),
    new Instruction("NOP", "No operation"),
    new Instruction("NOT", "Negate the operand, logical NOT"),
    new Instruction("OR", "Logical OR", [
        new OpCodeWithRegAndImm("0C", reg("AL")),
        new OpCodeWithRegAndImm("0D", reg("AX")),
        new OpCodeWithModMR("08", 8, ["G", "G"]),
        new OpCodeWithModMR("09", 16, ["G", "G"]),
        new OpCodeWithModRM("0A", 8, ["G", "G"]),
        new OpCodeWithModRM("0B", 16, ["G", "G"]),
        new OpCodeWithModMI("80", "08", 8, ["G", "I"]),
        new OpCodeWithModMI("81", "08", 16, ["G", "I"])
        // TODO support mismatched operand sizes (sign extend)
        //new OpCodeWithModMI("83", "08", [16, 8], ["G", "I"]),
    ]),
    new Instruction("OUT", "Output to port"),
    new Instruction("POP", "Pop data from stack", [
        new OpCodeWithReg("58", reg("AX")),
        new OpCodeWithReg("59", reg("CX")),
        new OpCodeWithReg("5A", reg("DX")),
        new OpCodeWithReg("5B", reg("BX")),
        new OpCodeWithReg("5C", reg("SP")),
        new OpCodeWithReg("5D", reg("BP")),
        new OpCodeWithReg("5E", reg("SI")),
        new OpCodeWithReg("5F", reg("DI")),
        new OpCodeWithReg("06", reg("ES")),
        new OpCodeWithReg("0F", reg("CS")),
        new OpCodeWithReg("17", reg("SS")),
        new OpCodeWithReg("1F", reg("DS")),
        // new OpCodeWithModM("FE", "00", 8, ["G"]), // AL, AH, BL, BH, etc
        new OpCodeWithModM("8F", "00", 16, ["G"]) // AX, BX, etc
    ]),
    new Instruction("POPF", "Pop data from flags register", [
        new OpCodeOnly("9D")
    ]),
    new Instruction("PUSH", "Push data onto stack", [
        new OpCodeWithReg("50", reg("AX")),
        new OpCodeWithReg("51", reg("CX")),
        new OpCodeWithReg("52", reg("DX")),
        new OpCodeWithReg("53", reg("BX")),
        new OpCodeWithReg("54", reg("SP")),
        new OpCodeWithReg("55", reg("BP")),
        new OpCodeWithReg("56", reg("SI")),
        new OpCodeWithReg("57", reg("DI")),
        new OpCodeWithReg("06", reg("ES")),
        new OpCodeWithReg("0E", reg("CS")),
        new OpCodeWithReg("16", reg("SS")),
        new OpCodeWithReg("1E", reg("DS")),
        // new OpCodeWithModM("FE", "00", 8, ["G"]), // AL, AH, BL, BH, etc
        new OpCodeWithModM("FF", "30", 16, ["G"]) // AX, BX, etc
    ]),
    new Instruction("PUSHF", "Push flags onto stack", [
        new OpCodeOnly("9C")
    ]),
    new Instruction("RCL", "Rotate left (with carry)"),
    new Instruction("RCR", "Rotate right (with carry)"),
    new Instruction("RET", "Return from procedure", [
        new OpCodeWithImm("C2", 16),
        new OpCodeOnly("C3")
    ]),
    new Instruction("RETN", "Return from near procedure", [
        new OpCodeWithImm("C2", 16),
        new OpCodeOnly("C3")
    ]),
    new Instruction("RETF", "Return from far procedure", [
        new OpCodeWithImm("CA", 16),
        new OpCodeOnly("CB")
    ]),
    new Instruction("ROL", "Rotate left"),
    new Instruction("ROR", "Rotate right"),
    new Instruction("SAHF", "Store AH into flags", [
        new OpCodeOnly("9E")
    ]),
    new Instruction("SAL", "Shift Arithmetically left (signed shift left)"),
    new Instruction("SAR", "Shift Arithmetically right (signed shift right)"),
    new Instruction("SBB", "Subtraction with borrow", [
        new OpCodeWithRegAndImm("1C", reg("AL")),
        new OpCodeWithRegAndImm("1D", reg("AX")),
        new OpCodeWithModMR("18", 8, ["G", "G"]),
        new OpCodeWithModMR("19", 16, ["G", "G"]),
        new OpCodeWithModRM("1A", 8, ["G", "G"]),
        new OpCodeWithModRM("1B", 16, ["G", "G"]),
        new OpCodeWithModMI("80", "18", 8, ["G", "I"]),
        new OpCodeWithModMI("81", "18", 16, ["G", "I"])
        // TODO support mismatched operand sizes (sign extend)
        //new OpCodeWithModMI("83", "18", [16, 8], ["G", "I"]),
    ]),
    new Instruction("SCASB", "Compare byte string", [
        new OpCodeOnly("AE")
    ]),
    new Instruction("SCASW", "Compare word string", [
        new OpCodeOnly("AF")
    ]),
    new Instruction("SHL", "Shift left (unsigned shift left)"),
    new Instruction("SHR", "Shift right (unsigned shift right)"),
    new Instruction("STC", "Set carry flag", [
        new OpCodeOnly("F9")
    ]),
    new Instruction("STD", "Set direction flag", [
        new OpCodeOnly("FD")
    ]),
    new Instruction("STI", "Set interrupt flag", [
        new OpCodeOnly("FB")
    ]),
    new Instruction("STOSB", "Store byte in string", [
        new OpCodeOnly("AA")
    ]),
    new Instruction("STOSW", "Store word in string", [
        new OpCodeOnly("AB")
    ]),
    new Instruction("SUB", "Subtraction", [
        new OpCodeWithRegAndImm("2C", reg("AL")),
        new OpCodeWithRegAndImm("2D", reg("AX")),
        new OpCodeWithModMR("28", 8, ["G", "G"]),
        new OpCodeWithModMR("29", 16, ["G", "G"]),
        new OpCodeWithModRM("2A", 8, ["G", "G"]),
        new OpCodeWithModRM("2B", 16, ["G", "G"]),
        new OpCodeWithModMI("80", "28", 8, ["G", "I"]),
        new OpCodeWithModMI("81", "28", 16, ["G", "I"])
        // TODO support mismatched operand sizes (sign extend)
        //new OpCodeWithModMI("83", "28", [16, 8], ["G", "I"]),
    ]),
    new Instruction("TEST", "Logical compare (AND)", [
        new OpCodeWithRegAndImm("A8", reg("AL")),
        new OpCodeWithRegAndImm("A9", reg("AX")),
        new OpCodeWithModMR("84", 8, ["G", "G"]),
        new OpCodeWithModMR("84", 16, ["G", "G"])
    ]),
    new Instruction("WAIT", "Wait until not busy", [
        new OpCodeOnly("9B")
    ]),
    new Instruction("XCHG", "Exchange data", [
        new OpCodeWithModMR("86", 8, ["G", "G"]),
        new OpCodeWithModMR("87", 16, ["G", "G"])
        // AX, CX
        // AX, DX
        // AX, BX
        // AX, SP
        // AX, BP
        // AX, SI
        // AX, DI
    ]),
    new Instruction("XLAT", "Table look-up translation", [
        new OpCodeOnly("D7")
    ]),
    new Instruction("XOR", "Exclusive OR", [
        new OpCodeWithRegAndImm("34", reg("AL")),
        new OpCodeWithRegAndImm("35", reg("AX")),
        new OpCodeWithModMR("30", 8, ["G", "G"]),
        new OpCodeWithModMR("31", 16, ["G", "G"]),
        new OpCodeWithModRM("32", 8, ["G", "G"]),
        new OpCodeWithModRM("33", 16, ["G", "G"]),
        new OpCodeWithModMI("80", "30", 8, ["G", "I"]),
        new OpCodeWithModMI("81", "30", 16, ["G", "I"])
        // TODO support mismatched operand sizes (sign extend)
        //new OpCodeWithModMI("83", "30", [16, 8], ["G", "I"]),
    ])
];

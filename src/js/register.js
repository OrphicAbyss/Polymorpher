"use strict";

export class Register {
    constructor (register, bits, types, regBits, name, type) {
        this.key = register;
        this.bits = bits;
        this.types = types;
        this.regBits = regBits;
        this.name = name;
        this.regType = type;
        this.type = "REGISTER";
    }

    getBytes () {
        return this.regBits;
    }

    toString () {
        return `Register (${this.key})`;
    }
}

export const registers = [
    new Register("AL", 8, ["G", "E"], "000", "AL", "General Register"),
    new Register("BL", 8, ["G", "E"], "011", "BL", "General Register"),
    new Register("CL", 8, ["G", "E"], "001", "CL", "General Register"),
    new Register("DL", 8, ["G", "E"], "010", "DL", "General Register"),
    new Register("AH", 8, ["G", "E"], "100", "AH", "General Register"),
    new Register("BH", 8, ["G", "E"], "111", "BH", "General Register"),
    new Register("CH", 8, ["G", "E"], "101", "CH", "General Register"),
    new Register("DH", 8, ["G", "E"], "110", "DH", "General Register"),
    new Register("AX", 16, ["G", "E"], "000", "AX", "General Register"),
    new Register("BX", 16, ["G", "E"], "011", "BX", "General Register"),
    new Register("CX", 16, ["G", "E"], "001", "CX", "General Register"),
    new Register("DX", 16, ["G", "E"], "010", "DX", "General Register"),
    new Register("SP", 16, ["G"], "100", "Stack Pointer", "Index register"),
    new Register("BP", 16, ["G"], "101", "Base Pointer", "Index register"),
    new Register("SI", 16, ["G"], "110", "Source Index", "Index register"),
    new Register("DI", 16, ["G"], "111", "Destination Index", "Index register"),
    // TODO: segment registers are really only 2 bit values, but they only seem to be used as 3 bit encodings
    new Register("CS", 16, ["S"], "001", "Code Segment", "Segment register"),
    new Register("DS", 16, ["S"], "011", "Data Segment", "Segment register"),
    new Register("ES", 16, ["S"], "000", "Extra Segment", "Segment register"),
    new Register("SS", 16, ["S"], "010", "Stack Segment", "Segment register")
];

/**
 * Looks up a register object based on the register name (key)
 *
 * @param {string} regCode Name of the register
 * @return {Register} Register object found
 */
export function reg(regCode) {
    return registers.find((reg) => reg.key === regCode);
}
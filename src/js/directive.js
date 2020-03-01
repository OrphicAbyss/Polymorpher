"use strict";

import {StrToken} from "./tokeniser";

export class Directive {
    constructor (directive, name, paramCount) {
        this.key = directive;
        this.paramCount = paramCount;
        this.type = "DIRECTIVE";
    }

    toString () {
        return `Directive (${this.key})`;
    }
}

// TODO: Separate these into different types based on required handling of next token
export class DefineDataDirective extends Directive {
    constructor (directive, name, bitSize) {
        super(directive, name, 1);
        this.bits = bitSize;
    }

    toCode (value) {
        if (value instanceof StrToken) {
            return value.toCode();
        }

        let output = "";
        for (let i = 0; i < this.bitSize; i++) {
            output += "0";
        }
        return output;
    }
}

export class ReserveDataDirective extends Directive {
    constructor (directive, name, bitSize) {
        super(directive, name, 0);
        this.bits = bitSize;
    }

    toCode () {
        let output = "";
        for (let i = 0; i < this.bitSize; i++) {
            output += "0";
        }
        return output;
    }
}

export const directives = [
    new Directive("ORG", "Orgin of code", 1),
    new DefineDataDirective("DB", "Define Byte", 8),
    new DefineDataDirective("DW", "Define Word", 16),
    new DefineDataDirective("DD", "Define Double Word", 32),
    new DefineDataDirective("DP", "Define Pointer", 48),
    new DefineDataDirective("DF", "Define Far Pointer", 48),
    new DefineDataDirective("DQ", "Define Quad Word", 64),
    new DefineDataDirective("DT", "Define FPU Double", 80),
    new ReserveDataDirective("RB", "Reserve Byte", 8),
    new ReserveDataDirective("RW", "Reserve Word", 16),
    new ReserveDataDirective("RD", "Reserve Double Word", 32),
    new ReserveDataDirective("RP", "Reserve Pointer", 48),
    new ReserveDataDirective("RF", "Reserve Far Pointer", 48),
    new ReserveDataDirective("RQ", "Reserve Quad Word", 64),
    new ReserveDataDirective("RT", "Reserve FPU Double", 80)
];
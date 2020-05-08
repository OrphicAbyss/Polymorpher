"use strict";

import {StrToken} from "./tokeniser";
import {Immediate} from "./immediate";

export class Directive {
    constructor (directive, description, acceptParams) {
        this.key = directive;
        this.description = description;
        this.acceptParams = acceptParams;
        this.type = "DIRECTIVE";
    }

    toString () {
        return `Directive (${this.key})`;
    }
}

export class FormatDirective extends Directive {
    constructor (directive, description) {
        super(directive, description, true);
    }

    toCode (value) {
        console.log("Format code generation handled by format class.");
    }
}

export class SegmentDirective extends Directive {
    constructor (directive, description) {
        super(directive, description, true);
    }

    toCode (value) {
        // needs to pad the segment to a 16 byte paragraph
        const padding = 16 - value % 16;
        let output = "";
        for (let i = 0; i < padding; i++) {
            output += "00000000";
        }
        return output;
    }
}

// TODO: Separate these into different types based on required handling of next token
export class DefineDataDirective extends Directive {
    constructor (directive, description, bitSize) {
        super(directive, description, true);
        this.bits = bitSize;
    }

    toCode (...values) {
        return values.map((token) => {
            if (token instanceof StrToken) {
                return token.toCode();
            }
            if (token instanceof Immediate) {
                return token.getBytes(this.bits);
            }
        }).join("");
    }
}

export class ReserveDataDirective extends Directive {
    constructor (directive, description, bitSize) {
        super(directive, description, false);
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
    new Directive("ORG", "Orgin of code", true),
    new FormatDirective("FORMAT", "Executable Format", true),
    new Directive("ENTRY", "Program Entry Point", true),
    new Directive("STACK", "Size of Stack", true),
    new Directive("HEAP", "Size of Heap", true),
    new Directive("INCLUDE", "Include file text", true),
    new Directive("BYTE", "Byte size operand"),
    new Directive("WORD", "Word size operand"),
    new SegmentDirective("SEGMENT", "Segment Start and Label"),
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
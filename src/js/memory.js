"use strict";

import {Immediate} from "./immediate";
import {Register} from "./register";

export class Memory {
    constructor () {
        this.tokens = [];
        this.type = "MEMORY";

        this.regBase = null;
        this.regIndex = null;
        this.displacment = null;
    }

    addToken (token) {
        this.tokens.push(token);
        if (token instanceof Register) {
            if (token.key === "BX" || token.key === "BP") {
                if (this.regBase) {
                    throw new Error(`Memory Operand: Base register already set ${this.regBase.key}, can't take two base registers ${token.key}`);
                }
                this.regBase = token;
            } else if (token.key === "SI" || token.key === "DI") {
                if (this.regIndex) {
                    throw new Error(`Memory Operand: Index register already set ${this.regIndex.key}, can't take two index registers ${token.key}`);
                }
                this.regIndex = token;
            }
        } else if (token instanceof Immediate) {
            if (this.displacment) {
                throw new Error(`Memory Operand: Displacement value already set ${this.displacment.value}, can't take two displacment values ${token.value}`);
            }
            this.displacment = token;
        }
    }

    isDisplacmentOnly () {
        return !this.regBase && !this.regIndex && !!this.displacment;
    }

    getBytes (bits) {
        //return this.regBits;
        const displacements = this.tokens.filter(tok => tok instanceof Immediate);
        if (displacements.length > 1) {
            throw new Error("Too many displacement values in memory operand", tokens.join(", "));
        }
        return displacements.map(imm => imm.getBytes(bits));
    }

    toString () {
        return `Memory (${this.tokens})`;
    }
}
"use strict";

export class Memory {
    constructor () {
        this.tokens = [];
        this.type = "MEMORY";
    }

    addToken (token) {
        this.tokens.push(token);
    }

    getBytes () {
        //return this.regBits;
    }

    toString () {
        return `Memory (${this.tokens})`;
    }
}
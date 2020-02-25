"use strict";

const WHITESPACE = [" ", "\t"];

/**
 * Takes the code string and deals with pulling out characters in groups required by the tokeniser.
 */
class Scanner {
    constructor (code) {
        this.code = code + "";
        this.pos = 0;
    }

    isEof () {
        return this.code.length <= this.pos;
    };

    getCurrentChar () {
        return this.code.charAt(this.pos);
    }

    skipChar () {
        this.pos++;
    }

    skipChars (skipChars) {
        const data = this.code;
        let i = this.pos;

        for (; i < data.length; i++) {
            const value = data.charAt(i);

            if (-1 === skipChars.indexOf(value)) {
                break;
            }
        }

        this.pos = i;
    }

    getChars (endChars) {
        const data = this.code;
        let i = this.pos;

        for (; i < data.length; i++) {
            const value = data.charAt(i);

            if (-1 !== endChars.indexOf(value)) {
                break;
            }
        }

        const returnVal = data.substring(this.pos, i);
        this.pos = i;

        return returnVal;
    }

    lookChars (endChars) {
        const data = this.code;
        let i = this.pos;

        for (; i < data.length; i++) {
            const value = data.charAt(i);

            if (-1 !== endChars.indexOf(value)) {
                break;
            }
        }

        return data.substring(this.pos, i);
    }

    skipWhitespace () {
        this.skipChars(WHITESPACE);
    }
}

"use strict";

import {COMMA, COMMENT, IDENTIFIER, NEW_LINE, NUMERIC, STRING, UNKNOWN, Token} from "./tokens";
const WHITESPACE = [" ", "\t"];

/**
 * Takes the code string and deals with pulling out characters in groups required by the tokeniser.
 */
export class Scanner {
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
        return this.code.charAt(this.pos - 1);
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

export function scanCode (text) {
    const scanner = new Scanner(text);
    const lexemes = [];

    while (!scanner.isEof()) {
        // skip any whitespace
        scanner.skipWhitespace();

        let lexeme = null;
        const char = scanner.getCurrentChar();
        if (/^[;]$/i.test(char)) {
            // We matched a comment token
            lexeme = new Token(COMMENT, scanner.getChars(["\n"]));
        } else if (/^[a-z]$/i.test(char)) {
            // we matched a text token
            lexeme = new Token(IDENTIFIER, scanner.getChars([" ", ";", "\n", "\t", ","]));
        } else if (/^[0-9]$/i.test(char)) {
            // we matched a number token
            lexeme = new Token(NUMERIC, scanner.getChars([" ", ";", "\n", "\t", ","]));
        } else if (/^[,]$/i.test(char)) {
            // we matched a comma
            lexeme = new Token(COMMA, scanner.skipChar());
        } else if (/^[\"]$/i.test(char)) {
            // we matched a string literal
            scanner.skipChar();
            lexeme = new Token(STRING, `${scanner.getChars("\"")}`);
            scanner.skipChar();
        } else if (/^[\n]$/i.test(char)) {
            // we matched a new line
            lexeme = new Token(NEW_LINE, scanner.skipChar());
        } else {
            // we aren't sure what it is
            lexeme = new Token(UNKNOWN, scanner.skipChar());
        }
        lexemes.push(lexeme);
    }
    return lexemes;
}

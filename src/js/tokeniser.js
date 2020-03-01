"use strict";

import {prefixs} from "./prefix";
import {instructions} from "./instruction";
import {directives} from "./directive";
import {registers} from "./register";
import {Immediate} from "./immediate";

import {UNKNOWN, COMMENT, IDENTIFIER, NUMERIC, COMMA, STRING, NEW_LINE, Token} from "./tokens";

export class Label {
    constructor (label) {
        this.label = label;
        this.type = "LABEL";
    }

    toString () {
        return `Label (${this.label})`;
    }
}

export class Comma {
    constructor () {
        this.label = ",";
        this.type = "COMMA";
    }

    toString () {
        return "Comma (,)";
    }
}

export class NewLine {
    constructor () {
        this.label = "\\n";
        this.type = "NEWLINE";
    }

    toString () {
        return "New Line (\\n)";
    }
}

export class StrToken {
    constructor (string) {
        this.string = string;
        this.type = "STRING";
    }

    toCode () {
        let output = "";
        for (let i = 0; i < this.string.length; i++) {
            let char = this.string[i].charCodeAt(0).toString(2);
            while (char.length < 8) {
                char = "0" + char;
            }
            output += char;
        }
        return output;
    }

    toString () {
        return `String (${this.string})`;
    }
}

const keywords = [].concat(prefixs).concat(instructions).concat(directives).concat(registers);

export function tokenise (lexemes) {
    const tokens = [];
    let current = 0;

    while (current < lexemes.length) {
        const token = lexemes[current];
        switch (token.type) {
            case COMMENT:
                // ignore comment tokens
                current++;
                break;
            case UNKNOWN:
                // ignore comment tokens
                current++;
                break;
            case IDENTIFIER:
                const keyword = keywords.find((item) => item.key === token.token.toUpperCase());
                if (keyword === undefined) {
                    // most likely a label
                    tokens.push(new Label(token.token));
                } else {
                    tokens.push(keyword);
                }
                current++;
                break;
            case NUMERIC:
                tokens.push(new Immediate(token.token));
                current++;
                break;
            case COMMA:
                tokens.push(new Comma());
                current++;
                break;
            case STRING:
                tokens.push(new StrToken(token.token));
                current++;
                break;
            case NEW_LINE:
                const length = tokens.length;
                if (!(tokens[length - 1] instanceof NewLine) && length > 0) {
                    tokens.push(new NewLine());
                }
                current++;
                break;
        }
    }

    return tokens;
}

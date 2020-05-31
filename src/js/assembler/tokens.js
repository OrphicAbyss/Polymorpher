"use strict";

export const UNKNOWN = -1;
export const COMMENT = 0;
export const IDENTIFIER = 1;
export const NUMERIC = 2;
export const STRING = 3;
export const COMMA = 4;
export const COLON = 5;
export const NEW_LINE = 6;
export const BRACKET_LEFT = 7;
export const BRACKET_RIGHT = 8;
export const PLUS = 9;

export class Token {
    constructor (type, token) {
        this.token = token;
        this.type = type;
    }
}

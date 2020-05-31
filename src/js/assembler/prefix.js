"use strict";

export class Prefix {
    constructor (prefix, name) {
        this.key = prefix;
        this.name = name;
        this.type = "PREFIX";
    }

    toString () {
        return `Prefix (${this.key})`;
    }
}

//TODO: Add what instructions they are valid for
export const prefixs = [
    new Prefix("LOCK", "Lock (Preform as atomic)"),
    new Prefix("REP", "Repeat for Count"),
    new Prefix("REPE", "Repeat for Count or Equal"),
    new Prefix("REPZ", "Repeat for Count or Zero"),
    new Prefix("REPNE", "Repeat for Count or Not Equal"),
    new Prefix("REPNZ", "Repeat for Count or Not Zero")
];

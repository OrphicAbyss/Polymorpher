"use strict";

export class Immediate {
    constructor (str) {
        this.number = str;
        const lastChar = str[str.length - 1];

        if (lastChar === "b") {
            this.numericType = "Binary";
            this.value = parseInt(str.substr(0, str.length - 1), 2);
        } else if (lastChar === "o") {
            this.numericType = "Octal";
            this.value = parseInt(str.substr(0, str.length - 1), 8);
        } else if (lastChar === "h") {
            this.numericType = "Hexadecimal";
            this.value = parseInt(str.substr(0, str.length - 1), 16);
        } else {
            this.numericType = "Decimal";
            this.value = parseInt(str, 10);
        }

        this.bits = this.value.toString(2).length;
        this.bits = this.bits > 32 ? this.bits : (this.bits > 16 ? 32 : (this.bits > 8 ? 16 : 8));

        this.types = ["I"];
        this.type = "IMMEDIATE";
    }

    getBytes (bits) {
        let strVal = this.value.toString(2);
        if (strVal.length > bits) {
            console.log(`Immediate too large: ${strVal} (${strVal.length} bits wanted ${bits} bits`);
            strVal = "0";
            while (strVal.length < bits) {
                strVal = "0" + strVal;
            }
        }
        while (strVal.length < bits) {
            strVal = "0" + strVal;
        }
        // chunk into 8 bit lots and reverse for little endian
        let output = "";
        for (let i = 0; i < strVal.length; i += 8) {
            output = strVal.substr(i, 8) + output;
        }

        return output;
    }

    toString () {
        return `${this.numericType} Number (${this.number}) [${this.bits} bits]`;
    }
}

export class PlaceholderImmediate extends Immediate {
    constructor (label) {
        super("0");
        this.label = label;
    }
}

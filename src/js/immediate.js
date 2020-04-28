"use strict";

export class Immediate {
    constructor (str) {
        this.number = str;
        const lastChar = str[str.length - 1];

        switch (lastChar) {
            case "b":
                this.numericType = "Binary";
                this.value = parseInt(str.substr(0, str.length - 1), 2);
                break;
            case "o":
                this.numericType = "Octal";
                this.value = parseInt(str.substr(0, str.length - 1), 8);
                break;
            case "h":
                this.numericType = "Hexadecimal";
                this.value = parseInt(str.substr(0, str.length - 1), 16);
                break;
            default:
                this.numericType = "Decimal";
                this.value = parseInt(str, 10);
                break;
        }

        this.fixedSize = false;
        this.calculateSize();

        this.types = ["I"];
        this.type = "IMMEDIATE";
    }

    calculateSize () {
        if (!this.fixedSize) {
            this.bits = this.value.toString(2).length;
            this.bits = this.bits > 32 ? this.bits : (this.bits > 16 ? 32 : (this.bits > 8 ? 16 : 8));
        }
    }

    setBits (bits) {
        if (this.bits > bits) {
            throw new Error(`Immediate value (${this.bits} bits) larger than bit size provided (${bits} bits) - ${this.number}`);
        }
        this.bits = bits;
        this.fixedSize = true;
    }

    getBytes (bits) {
        if (this.fixedSize && this.bits !== bits) {
            throw new Error(`Immediate value asked for different size (${bits} bits) than set by directive (${this.bits} bits) - ${this.number}`);
        }
        let invert = false;
        let val = this.value;

        if (val < 0) {
            // handle negative value
            val = -1 * val + 1;
            invert = true;
        }

        let strVal = val.toString(2);
        if (strVal.length > bits) {
            console.log(`Immediate too large: ${strVal} (${strVal.length} bits wanted ${bits} bits`);
            strVal = "0";
        }
        while (strVal.length < bits) {
            strVal = "0" + strVal;
        }

        // chunk into 8 bit lots and reverse for little endian
        let output = "";
        for (let i = 0; i < strVal.length; i += 8) {
            output = strVal.substr(i, 8) + output;
        }

        if (invert) {
            output = output.split("").map(char => "0" === char ? "1" : "0").join("");
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

    toString () {
        return `${this.numericType} Number (${this.number}) [${this.bits} bits]`;
    }
}

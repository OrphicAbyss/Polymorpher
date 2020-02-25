"use strict";

class Operand {
}

class Immediate extends Operand {
    constructor (str) {
        super();

        this.number = str;
        const lastChar = str[str.length - 1];

        if (lastChar === "b") {
            this.type = "Binary";
            this.value = parseInt(str.substr(0, str.length - 1), 2);
        } else if (lastChar === "o") {
            this.type = "Octal";
            this.value = parseInt(str.substr(0, str.length - 1), 8);
        } else if (lastChar === "h") {
            this.type = "Hexadecimal";
            this.value = parseInt(str.substr(0, str.length - 1), 16);
        } else {
            this.type = "Decimal";
            this.value = parseInt(str, 10);
        }

        this.bits = this.value.toString(2).length;
        this.bits = this.bits > 32 ? this.bits : (this.bits > 16 ? 32 : (this.bits > 8 ? 16 : 8));

        this.types = ["I"];
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
        return `${this.type} Number (${this.number.fontcolor("red")}) [${this.bits} bits]`;
    }
}

class PlaceholderImmediate extends Immediate {
    constructor (label) {
        super("0");
        this.label = label;
    }
}

class Register extends Operand {
    constructor (register, bits, types, regBits, name, type) {
        super();
        this.register = register;
        this.bits = bits;
        this.types = types;
        this.regBits = regBits;
        this.name = name;
        this.type = type;
    }

    toString () {
        return "Register (" + this.register.fontcolor("green") + ")";
    };
}

class Prefix {
    constructor (prefix, name) {
        this.prefix = prefix;
        this.name = name;

    }

    toString () {
        return "Prefix (" + prefix.fontcolor("aqua") + ")";
    }
}

class Instruction {
    constructor (instruction, name, operandCount, opcodes, getCode) {
        this.instruction = instruction;
        this.name = name;
        this.operandCount = operandCount;
        this.opcodes = opcodes;
        this.getCode = getCode;
    }

    toString () {
        return `Instruction (${this.instruction.fontcolor("blue")})`;
    }
}

class OpCode {
    constructor (code, operandTypes) {
    }
}

class OperandType {
    constructor (bits, type) {
        this.bits = bits;
        this.type = type;
    }
}

class Directive {
    constructor (directive, name, paramCount) {
        this.directive = directive;
        this.paramCount = paramCount;
    }

    toString () {
        return `Directive (${this.directive.fontcolor("green")})`;
    }
}

// TODO: Seperate these into different types based on required handling of next token
class DefineDataDirective extends Directive {
    constructor (directive, name, bitSize) {
        super(directive, name, 1);
        this.bitSize = bitSize;
    }

    toCode (value) {
        if (value instanceof StringToken) {
            return value.toCode();
        }

        let output = "";
        for (let i = 0; i < this.bitSize; i++) {
            output += "0";
        }
        return output;
    }
}

class ReserveDataDirective extends Directive {
    constructor (directive, name, bitSize) {
        super(directive, name, 0);
        this.bitSize = bitSize;
    }

    toCode () {
        let output = "";
        for (let i = 0; i < this.bitSize; i++) {
            output += "0";
        }
        return output;
    }
}

class Label {
    constructor (label) {
        this.label = label;
    }

    toString () {
        return "Label (" + this.label.fontcolor("orange") + ") ";
    }
}

class StringToken {
    constructor (str) {
        this.string = str;
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
        return `String (${this.string.fontcolor("maroon")})`;
    }
}

function Comma () {
    this.toString = function () {
        return ",";
    };
}

function Newline () {
    this.toString = function () {
        return "<br/>";
    };
}

class Tokeniser {
    constructor (code) {
        this.tokens = [];
        this.token = 0;
        this.scanner = new Scanner(code);
    }

    nextToken () {
        var val, tok, j;

        while (!this.scanner.isEof()) {
            this.scanner.skipWhitespace();
            if (!this.scanner.isEof()) {
                val = this.scanner.getCurrentChar();

                if (/^[a-z]$/i.test(val)) {
                    tok = this.scanner.getChars([" ", ";", "\n", "\t", ","]);
                    if (tok.indexOf(":", tok.length - 1) !== -1) {
                        return new Label(tok.substring(0, tok.length - 1));
                    } else {
                        const upperTok = tok.toUpperCase();
                        for (j = 0; j < Prefixs.length; j++) {
                            if (Prefixs[j].prefix === upperTok) {
                                return Prefixs[j];
                            }
                        }
                        for (j = 0; j < Instructions.length; j++) {
                            if (Instructions[j].instruction === upperTok) {
                                return Instructions[j];
                            }
                        }
                        for (j = 0; j < Registers.length; j++) {
                            if (Registers[j].register === upperTok) {
                                return Registers[j];
                            }
                        }
                        for (j = 0; j < Directives.length; j++) {
                            if (Directives[j].directive === upperTok) {
                                return Directives[j];
                            }
                        }
                        // unknown, treat as label
                        return new Label(tok);
                    }
                } else if (/^[0-9]$/i.test(val)) {
                    return new Immediate(this.scanner.getChars([" ", ";", "\n", "\t", ","]));
                } else if (/^[;]$/i.test(val)) {
                    this.scanner.getChars(["\n"]);
                    //this.tokens.push(new Comment());
                } else if (/^[,]$/i.test(val)) {
                    this.scanner.skipChar();
                    return new Comma();
                } else if (/^[\"]$/i.test(val)) {
                    // string
                    this.scanner.skipChar();
                    const tok = new StringToken(this.scanner.getChars("\""));
                    this.scanner.skipChar();
                    return tok;
                } else if (/^[\n]$/i.test(val)) {
                    this.scanner.skipChar();
                    return new Newline();
                } else {
                    this.scanner.skipChar();
                    console.log("Unknown char: '" + val + "' char value: " + val.charCodeAt(0));
                }
            }
        }

        return "";
    }

    hasMoreTokens () {
        return !this.scanner.isEof();
    }
}

function Parse (text) {
    const tokeniser = new Tokeniser(text);
    const tokens = [];
    let codeOut = "";

    while (tokeniser.hasMoreTokens()) {
        const token = tokeniser.nextToken();
        tokens.push(token);
        codeOut += token.toString() + " ";// + "<br/>";
    }

    this.asm = codeOut;
    this.tokens = tokens;
}


function assemble (tokens) {
    function moreTokens () {
        return 0 !== tokens.length;
    }

    function getToken () {
        return tokens.shift();
    }

    let orgOffset = 0;
    const labels = [];
    const placeholders = [];
    var output = "", binaryOutput = [], opcode, bitCount, token, prefix, instruction, operands, ok, j;

    try {
        while (moreTokens()) {
            token = getToken();
            prefix = null;

            // Match newlines
            while (tokens.length > 0 && token instanceof Newline) {
                token = getToken();
            }

            if (token instanceof Label) {
                const position = binaryOutput.map((bits) => bits.length).reduce((sum, bits) => sum + bits, 0) / 8;
                labels.push({label: token, position});
                output += token.toString() + "<br/>";
                output += tokens[0];
                if (tokens[0] instanceof Directive) {
                    // calculate location for label
                    const directive = getToken();
                    output += directive.toString() + "<br/>";
                    const paramsCount = directive.paramCount;
                    const params = [];
                    for (j = 0; j < paramsCount; j++) {
                        params.push(getToken());
                        output += `- ${params[j].toString()}<br/>`;
                    }
                    binaryOutput.push(`${directive.toCode(...params)}`);
                }
            } else if (token instanceof Directive) {
                const directive = token;
                output += directive.toString() + "<br/>";
                const params = [];
                for (j = 0; j < directive.paramCount; j++) {
                    token = getToken();
                    output += `- ${token.toString()}<br/>`;
                    params.push(token);
                }
                // if it's the 'origin' directive, set the code offset
                if (directive.directive === "ORG") {
                    if (params.length === 1 && params[0] instanceof Immediate) {
                        orgOffset = params[0].value;
                    } else {
                        output += `ORG directive must have a single parameter of type immediate.`;
                    }
                }
            } else if (token instanceof Instruction) {
                if (token instanceof Prefix) {
                    prefix = token;
                    output += "Prefixes not yet supported.<br/>";
                    token = getToken();
                }

                instruction = token;
                operands = [];
                output += `${instruction.toString()}<br/>`;
                if (instruction.operandCount !== undefined) {
                    ok = true;

                    for (j = 0; j < instruction.operandCount; j++) {
                        token = getToken();
                        output += `- ${token.toString()}<br/>`;

                        if (token === undefined) {
                            break;
                        }

                        if (j !== 0) {
                            if (!(token instanceof Comma)) {
                                output += "Expected comma, found: " + token.toString() + "<br/>";
                                ok = false;
                                break;
                            } else {
                                token = getToken();
                                output += `- ${token.toString()}<br/>`;
                            }
                        }

                        if (token instanceof Operand) {
                            operands.push(token);
                        } else if (token instanceof Label) {
                            const placeHolder = new PlaceholderImmediate(token);
                            operands.push(placeHolder);
                        } else {
                            output += "Expected operand, found: " + token.toString() + "<br/>";
                            ok = false;
                            break;
                        }
                    }

                    if (ok) {
                        opcode = null;
                        bitCount = operands[0].bits;
                        for (var l = 0; l < instruction.opcodes.length; l++) {
                            var code = instruction.opcodes[l];
                            var validOp = false;
                            if (code.size === bitCount && code.operands.length === operands.length) {
                                validOp = true;
                                for (var k = 0; k < operands.length; k++) {
                                    if (-1 === operands[k].types.indexOf(code.operands[k])) {
                                        validOp = false;
                                        break;
                                    }
                                }
                            }

                            if (validOp === true) {
                                if (instruction.getCode) {
                                    if (operands.filter(item => item instanceof PlaceholderImmediate).length > 0) {
                                        placeholders.push({
                                            instruction,
                                            params: [l].concat(operands),
                                            position: binaryOutput.length
                                        });
                                    }
                                    binaryOutput.push(instruction.getCode(l, ...operands));
                                } else {
                                    output += code.code + "<br/>";
                                }
                                break;
                            }
                        }
                    }

                    // Match newline
                    if (tokens.length > 0 && tokens[0] instanceof Newline) {
                        token = getToken();
                    }

                } else {
                    // expected instruction
                    output += "- Instruction not yet supported";

                    while (!(tokens[0] instanceof Prefix || tokens[0] instanceof Instruction) && 0 !== tokens.length) {
                        token = getToken();
                        output += "- Ignoring tokens until instruction found: " + token.toString() + "<br/>";
                    }
                }
            } else {
                // expected instruction
                output += "Expected instruction found: " + token.toString() + "<br/>";

                while (!(tokens[0] instanceof Prefix || tokens[0] instanceof Instruction) && 0 !== tokens.length) {
                    token = getToken();
                    output += "Expected instruction found: " + token.toString() + "<br/>";
                }
            }
        }
    } catch (e) {
        console.log(e);
    }

    // loop through placeholders to lookup values
    placeholders.forEach((placeholder) => {
        const fixedOperands = placeholder.params.map((param) => {
            if (param instanceof PlaceholderImmediate) {
                const label = param.label;
                const posLabel = labels.filter((labelEntry) => labelEntry.label.label === label.label);
                switch (posLabel.length) {
                    case 0:
                        output += `No label definition found during 2 pass processing: ${label.label}<br/>`;
                        return param;
                    case 1:
                        return new Immediate(posLabel[0].position + orgOffset);
                    default:
                        output += `Multiple label definitions found during 2 pass processing: ${label.label}<br/>`;
                        return param;
                }
            }
            return param;
        });
        // replace binary output of code with fixed offset
        binaryOutput[placeholder.position] = placeholder.instruction.getCode(...fixedOperands);
    });

    // add spaces to binary
    let formattedBinary = "";
    const binary = binaryOutput.join("");
    for (let i = 0; i < binary.length; i++) {
        if (i % (8 * 6) === 0 && i !== 0) {
            formattedBinary += "<br/>";
        } else if (i % 8 === 0 && i !== 0) {
            formattedBinary += " ";
        }
        formattedBinary += "" + binary.charAt(i);
    }

    return {output, binaryOutput: formattedBinary};
}

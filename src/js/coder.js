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

const Registers = [
    new Register("AL", 8, ["G", "E"], "000", "AL", "General Register"),
    new Register("BL", 8, ["G", "E"], "011", "BL", "General Register"),
    new Register("CL", 8, ["G", "E"], "001", "CL", "General Register"),
    new Register("DL", 8, ["G", "E"], "010", "DL", "General Register"),
    new Register("AH", 8, ["G", "E"], "100", "AH", "General Register"),
    new Register("BH", 8, ["G", "E"], "111", "BH", "General Register"),
    new Register("CH", 8, ["G", "E"], "101", "CH", "General Register"),
    new Register("DH", 8, ["G", "E"], "110", "DH", "General Register"),
    new Register("AX", 16, ["G", "E"], "000", "AX", "General Register"),
    new Register("BX", 16, ["G", "E"], "011", "BX", "General Register"),
    new Register("CX", 16, ["G", "E"], "001", "CX", "General Register"),
    new Register("DX", 16, ["G", "E"], "010", "DX", "General Register"),
    new Register("SP", 16, ["G"], "100", "Stack Pointer", "Index register"),
    new Register("BP", 16, ["G"], "101", "Base Pointer", "Index register"),
    new Register("SI", 16, ["G"], "110", "Source Index", "Index register"),
    new Register("DI", 16, ["G"], "111", "Destination Index", "Index register"),
    new Register("CS", 16, ["S"], "01", "Code Segment", "Segment register"),
    new Register("DS", 16, ["S"], "11", "Data Segment", "Segment register"),
    new Register("ES", 16, ["S"], "00", "Extra Segment", "Segment register"),
    new Register("SS", 16, ["S"], "10", "Stack Segment", "Segment register")
];

class Prefix {
    constructor (prefix, name) {
        this.prefix = prefix;
        this.name = name;

    }

    toString () {
        return "Prefix (" + prefix.fontcolor("aqua") + ")";
    }
}

//TODO: Add what instructions they are valid for
const Prefixs = [
    new Prefix("LOCK", "Lock (Preform as atomic)"),
    new Prefix("REP", "Repeat for Count"),
    new Prefix("REPE", "Repeat for Count or Equal"),
    new Prefix("REPZ", "Repeat for Count or Zero"),
    new Prefix("REPNE", "Repeat for Count or Not Equal"),
    new Prefix("REPNZ", "Repeat for Count or Not Zero")
];

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

const Instructions = [
    new Instruction("AAA", "ASCII adjust AL after addition"),
    new Instruction("AAD", "ASCII adjust AX before division"),
    new Instruction("AAM", "ASCII adjust AX after multiplication"),
    new Instruction("AAS", "ASCII adjust AL after subtraction"),
    new Instruction("ADC", "Add with carry", 2, [
        {"code": "10", "operands": ["G", "E"], "size": 8},
        {"code": "11", "operands": ["G", "E"], "size": 16},
        {"code": "12", "operands": ["E", "G"], "size": 8},
        {"code": "13", "operands": ["E", "G"], "size": 16}
    ]),
    new Instruction("ADD", "Add", 2, [
            {"code": "0000000011rrrrrr", "operands": ["G", "G"], "size": 8}, //1 -> 2
            {"code": "0000000111rrrrrr", "operands": ["G", "G"], "size": 16},//1 -> 2
            // {"code": "00000000mmrrrrrr", "operands": ["G", "M"], "size": 8}, //1 -> 2
            // {"code": "00000001mmrrrrrr", "operands": ["G", "M"], "size": 16},//1 -> 2
            {"code": "0000001011rrrrrr", "operands": ["G", "G"], "size": 8}, //2 -> 1
            {"code": "0000001111rrrrrr", "operands": ["G", "G"], "size": 16},//2 -> 1
            // {"code": "00000010mmrrrrrr", "operands": ["G", "M"], "size": 8}, //2 -> 1
            // {"code": "00000011mmrrrrrr", "operands": ["G", "M"], "size": 16},//2 -> 1
            {"code": "1000000011000rrr", "operands": ["G", "I"], "size": 8}, //I -> R
            // {"code": "10000000mm100rrr", "operands": ["M", "I"], "size": 8}, //I -> M
            {"code": "1000000111000rrr", "operands": ["G", "I"], "size": 16}//I -> R
            // {"code": "10000001mm100rrr", "operands": ["M", "I"], "size": 16}//I -> M
            //sign extend version
            //{"code": "10000010", "operands": ["E", "I"], "size": 8},
            //{"code": "10000011", "operands": ["E", "I"], "size": 16}
        ],
        function (op, op1, op2) {
            const opcode = this.opcodes[op];
            let out = opcode.code.replace("rrr", op1.regBits);

            if (opcode.operands[1] === "I") {
                out = out + op2.getBytes(opcode.size);
            } else {
                out = out.replace("rrr", op2.regBits);
            }

            return out;
        }),
    new Instruction("AND", "Logical AND"),
    new Instruction("CALL", "Call procedure"),
    new Instruction("CBW", "Convert byte to word"),
    new Instruction("CLC", "Clear carry flag"),
    new Instruction("CLD", "Clear direction flag"),
    new Instruction("CLI", "Clear interrupt flag"),
    new Instruction("CMC", "Complement carry flag"),
    new Instruction("CMP", "Compare operands"),
    new Instruction("CMPSB", "Compare bytes in memory"),
    new Instruction("CMPSW", "Compare words"),
    new Instruction("CWD", "Convert word to doubleword"),
    new Instruction("DAA", "Decimal adjust AL after addition"),
    new Instruction("DAS", "Decimal adjust AL after subtraction"),
    new Instruction("DEC", "Decrement by 1"),
    new Instruction("DIV", "Unsigned divide"),
    new Instruction("ESC", "Used with floating-point unit"),
    new Instruction("HLT", "Enter halt state"),
    new Instruction("IDIV", "Signed divide"),
    new Instruction("IMUL", "Signed multiply"),
    new Instruction("IN", "Input from port"),
    new Instruction("INC", "Increment by 1", 1, [
            {"code": "1111111011000rrr", "operands": ["G"], "size": 8}, // AL, AH, BL, BH, etc
            {"code": "01000rrr", "operands": ["G"], "size": 16} // AX, BX, CX, DX only
        ],
        function (op, op1) {
            const opcode = this.opcodes[op];
            let out = opcode.code.replace("rrr", op1.regBits);
            return out;
        }),
    new Instruction("INT", "Call to interrupt", 1, [
            {"code": "CD", "operands": ["I"], "size": 8}
        ],
        function (op, op1) {
            const opcode = this.opcodes[op];
            let out = parseInt(opcode.code, 16).toString(2);
            out = out + op1.getBytes(opcode.size);
            return out;
        }),
    new Instruction("INTO", "Call to interrupt if overflow"),
    new Instruction("IRET", "Return from interrupt"),
    new Instruction("JA", "Jump if Above"),
    new Instruction("JNA", "Jump if Not Above"),
    new Instruction("JAE", "Jump if Above or Equal"),
    new Instruction("JNAE", "Jump if Not Above or Equal"),
    new Instruction("JB", "Jump if Below"),
    new Instruction("JNB", "Jump if Not Below"),
    new Instruction("JBE", "Jump if Below or Equal"),
    new Instruction("JNBE", "Jump if Not Below or Equal"),
    new Instruction("JC", "Jump if Carry Flag Set"),
    new Instruction("JNC", "Jump if Carry Flag Not Set"),
    new Instruction("JE", "Jump if Equal"),
    new Instruction("JNE", "Jump if Not Equal"),
    new Instruction("JG", "Jump if Greater"),
    new Instruction("JNG", "Jump if Not Greater"),
    new Instruction("JGE", "Jump if Greater or Equal"),
    new Instruction("JNGE", "Jump if Not Greater or Equal"),
    new Instruction("JL", "Jump if Less"),
    new Instruction("JNL", "Jump if Not Less"),
    new Instruction("JLE", "Jump if Less or Equal"),
    new Instruction("JNLE", "Jump if Not Less or Equal"),
    new Instruction("JO", "Jump if Overflow"),
    new Instruction("JNO", "Jump if Not Overflow"),
    new Instruction("JP", "Jump if Parity"),
    new Instruction("JNP", "Jump if Not Parity"),
    new Instruction("JPE", "Jump if Parity Even"),
    new Instruction("JPO", "Jump if Parity Odd"),
    new Instruction("JS", "Jump if Sign (Negative)"),
    new Instruction("JNS", "Jump if Not Sign (Positive)"),
    new Instruction("JZ", "Jump if Zero"),
    new Instruction("JNZ", "Jump if Not Zero"),
    new Instruction("JCXZ", "Jump if CX is zero"),
    new Instruction("JMP", "Jump"),
    new Instruction("LAHF", "Load flags into AH register"),
    new Instruction("LDS", "Load pointer using DS"),
    new Instruction("LEA", "Load Effective Address"),
    new Instruction("LES", "Load ES with pointer"),
    new Instruction("LOCK", "Assert BUS LOCK# signal"),
    new Instruction("LODSB", "Load string byte"),
    new Instruction("LODSW", "Load string word"),
    new Instruction("LOOP", "Loop control"),
    new Instruction("LOOPE", "Loop control and Equal"),
    new Instruction("LOOPNE", "Loop control and Not Equal"),
    new Instruction("LOOPZ", "Loop control and Zero"),
    new Instruction("LOOPNZ", "Loop control and Not Zero"),
    new Instruction("MOV", "Move", 2, [
            {"code": "1000100011rrrrrr", "operands": ["G", "G"], "size": 8}, //1 -> 2
            {"code": "1000100111rrrrrr", "operands": ["G", "G"], "size": 16},//1 -> 2
            {"code": "1000101011rrrrrr", "operands": ["G", "G"], "size": 8}, //2 -> 1
            {"code": "1000101111rrrrrr", "operands": ["G", "G"], "size": 16},//2 -> 1
            {"code": "10001000mmrrrrrr", "operands": ["G", "M"], "size": 8}, //1 -> 2
            {"code": "10001001mmrrrrrr", "operands": ["G", "M"], "size": 16},//1 -> 2
            {"code": "10001010mmrrrrrr", "operands": ["G", "M"], "size": 8}, //2 -> 1
            {"code": "10001011mmrrrrrr", "operands": ["G", "M"], "size": 16},//2 -> 1
            {"code": "10110rrr", "operands": ["G", "I"], "size": 8}, //I -> R
            {"code": "10111rrr", "operands": ["G", "I"], "size": 16} //I -> R
            //{"code": "10000000mm100rrr", "operands": ["M", "I"], "size": 8}, //I -> M
            //{"code": "10000001mm100rrr", "operands": ["M", "I"], "size": 16},//I -> M
            //sign extend version
            //{"code": "10000010", "operands": ["E", "I"], "size": 8},
            //{"code": "10000011", "operands": ["E", "I"], "size": 16}
        ],
        function (op, op1, op2) {
            const opcode = this.opcodes[op];
            let out = opcode.code.replace("rrr", op1.regBits);

            if (this.opcodes[op].operands[1] === "I") {
                out = out + op2.getBytes(opcode.size);
            } else {
                out = out.replace("rrr", op2.regBits);
            }

            return out;
        }),
    new Instruction("MOVSB", "Move byte from string to string"),
    new Instruction("MOVSW", "Move word from string to string"),
    new Instruction("MUL", "Unsigned multiply"),
    new Instruction("NEG", "Two's complement negation"),
    new Instruction("NOP", "No operation"),
    new Instruction("NOT", "Negate the operand, logical NOT"),
    new Instruction("OR", "Logical OR"),
    new Instruction("OUT", "Output to port"),
    new Instruction("POP", "Pop data from stack"),
    new Instruction("POPF", "Pop data from flags register"),
    new Instruction("PUSH", "Push data onto stack"),
    new Instruction("PUSHF", "Push flags onto stack"),
    new Instruction("RCL", "Rotate left (with carry)"),
    new Instruction("RCR", "Rotate right (with carry)"),
    new Instruction("RET", "Return from procedure"),
    new Instruction("RETN", "Return from near procedure"),
    new Instruction("RETF", "Return from far procedure"),
    new Instruction("ROL", "Rotate left"),
    new Instruction("ROR", "Rotate right"),
    new Instruction("SAHF", "Store AH into flags"),
    new Instruction("SAL", "Shift Arithmetically left (signed shift left)"),
    new Instruction("SAR", "Shift Arithmetically right (signed shift right)"),
    new Instruction("SBB", "Subtraction with borrow", 2, [
        {"code": "18", "operands": ["G", "E"], "size": 8},
        {"code": "19", "operands": ["G", "E"], "size": 16},
        {"code": "1A", "operands": ["E", "G"], "size": 8},
        {"code": "1B", "operands": ["E", "G"], "size": 16}
    ]),
    new Instruction("SCASB", "Compare byte string"),
    new Instruction("SCASW", "Compare word string"),
    new Instruction("SHL", "Shift left (unsigned shift left)"),
    new Instruction("SHR", "Shift right (unsigned shift right)"),
    new Instruction("STC", "Set carry flag"),
    new Instruction("STD", "Set direction flag"),
    new Instruction("STI", "Set interrupt flag"),
    new Instruction("STOSB", "Store byte in string"),
    new Instruction("STOSW", "Store word in string"),
    new Instruction("SUB", "Subtraction", 2, [
        {"code": "28", "operands": ["G", "E"], "size": 8},
        {"code": "29", "operands": ["G", "E"], "size": 16},
        {"code": "2A", "operands": ["E", "G"], "size": 8},
        {"code": "2B", "operands": ["E", "G"], "size": 16}
    ]),
    new Instruction("TEST", "Logical compare (AND)"),
    new Instruction("WAIT", "Wait until not busy"),
    new Instruction("XCHG", "Exchange data"),
    new Instruction("XLAT", "Table look-up translation"),
    new Instruction("XOR", "Exclusive OR", 2, [
        {code: "1000000011110rrr", "operands": ["G", "I"], "size": 8},
        {code: "1000001111110rrr", "operands": ["G", "I"], "size": 16},
        {code: "1000001111rrrrrr", "operands": ["G", "G"], "size": 16}
    ], function (op, op1, op2) {
        const opcode = this.opcodes[op];
        let out = opcode.code.replace("rrr", op1.regBits);

        if (this.opcodes[op].operands[1] === "I") {
            out = out + op2.getBytes(opcode.size);
        } else {
            out = out.replace("rrr", op2.regBits);
        }

        return out;
    })
];

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

const Directives = [
    new Directive("ORG", "Orgin of code", 1),
    new DefineDataDirective("DB", "Define Byte", 8),
    new DefineDataDirective("DW", "Define Word", 16),
    new DefineDataDirective("DD", "Define Double Word", 32),
    new DefineDataDirective("DP", "Define Pointer", 48),
    new DefineDataDirective("DF", "Define Far Pointer", 48),
    new DefineDataDirective("DQ", "Define Quad Word", 64),
    new DefineDataDirective("DT", "Define FPU Double", 80),
    new ReserveDataDirective("DB", "Define Byte", 8),
    new ReserveDataDirective("DW", "Define Word", 16),
    new ReserveDataDirective("DD", "Define Double Word", 32),
    new ReserveDataDirective("DP", "Define Pointer", 48),
    new ReserveDataDirective("DF", "Define Far Pointer", 48),
    new ReserveDataDirective("DQ", "Define Quad Word", 64),
    new ReserveDataDirective("DT", "Define FPU Double", 80)
];

const WHITESPACE = [" ", "\t"];

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

const exampleDosProgram = `; Example DOS program which compiles as a .com file
; Prints 'Hello, world!', waits for a key press, then exits 
    org    100h       

    mov ah,09
    mov dx,msg
    int 21h
    mov ah,08
    int 21h
    int 20h
    msg db "hello world!$"
`;

angular.module("assemblerApp", [])
    .controller("Ctrl", function ($scope, $log, $sce) {
            $scope.update = function () {
                var parse = new Parse($scope.code);
                $scope.asm = parse.asm;
                $scope.tokens = parse.tokens;
                $scope.machine = assemble($scope.tokens.slice());

                if ($scope.machine && $scope.machine.binaryOutput) {
                    const binary = $scope.machine.binaryOutput.split("<br/>").join(" ").split(" ");
                    const buffer = binary.map((binary) => parseInt(binary, 2));
                    const blob = new Blob([new Uint8Array(buffer)], {type: "application/binary"});
                    const url = URL.createObjectURL(blob);
                    // const downloadSpan = document.getElementById("download-span");
                    // const button = document.createElement("a");
                    // button.setAttribute("href", url);
                    // button.text = "download";
                    // downloadSpan.appendChild(button);
                    const downloadButton = document.getElementById("download");
                    downloadButton.setAttribute("href", url);
                    downloadButton.setAttribute("download", "code.com");
                    // downloadButton.click();
                } else {
                    // const downloadButton = document.getElementById("download");
                    // downloadButton.setAttribute("href", "");
                    // downloadButton.setAttribute("download", "");
                }
            };

            $scope.codeView = function () {
                return $sce.trustAsHtml($scope.asm);
            };

            $scope.machineView = function () {
                return $sce.trustAsHtml($scope.machine.output);
            };

            $scope.binaryView = function () {
                return $sce.trustAsHtml($scope.machine.binaryOutput);
            };

            $scope.code = exampleDosProgram;
            $scope.update();

            $scope.$watch("code", function () {
                $scope.update();
            });
        }
    );


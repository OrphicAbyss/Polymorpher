"use strict";

class Operand {}

class Register  extends Operand {
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

class Immediate extends Operand {
    constructor (number) {
        super();
        let value;
        let type = "";
        const lastChar = number[number.length - 1];
        if (lastChar === "b") {
            type = "Binary";
            value = parseInt(number.substr(0, number.length - 1), 2);
        } else if (lastChar === "o") {
            type = "Octal";
            value = parseInt(number.substr(0, number.length - 1), 8);
        } else if (lastChar === "h") {
            type = "Hexadecimal";
            value = parseInt(number.substr(0, number.length - 1), 16);
        } else {
            type = "Decimal";
            value = parseInt(number, 10);
        }

        this.types = ["I"];

        this.getBytes = function (bits) {
            var strVal = value.toString(2);
            if (strVal.length > bits) {
                console.log("Immediate too large: " + strVal + " (" + strVal.length + " bits wanted " + bits + " bits");
            }
            while (strVal.length < bits) {
                strVal = "0" + strVal;
            }
            return strVal;
        };

        this.toString = function () {
            return type + " Number (" + number.fontcolor("red") + ")";
        };
    }
}

const Registers = [
    new Register("AL", 8, ["G","E"], "000", "AL", "Main Register"),
    new Register("BL", 8, ["G","E"], "010", "BL", "Main Register"),
    new Register("CL", 8, ["G","E"], "001", "CL", "Main Register"),
    new Register("DL", 8, ["G","E"], "011", "DL", "Main Register"),
    new Register("AH", 8, ["G","E"], "100", "AH", "Main Register"),
    new Register("BH", 8, ["G","E"], "111", "BH", "Main Register"),
    new Register("CH", 8, ["G","E"], "101", "CH", "Main Register"),
    new Register("DH", 8, ["G","E"], "110", "DH", "Main Register"),
    new Register("AX", 16, ["G","E"], "000", "AX", "Main Register"),
    new Register("BX", 16, ["G","E"], "011", "BX", "Main Register"),
    new Register("CX", 16, ["G","E"], "001", "CX", "Main Register"),
    new Register("DX", 16, ["G","E"], "010", "DX", "Main Register"),
    new Register("SI", 16, [], "110", "Source Index", "Index register"),
    new Register("DI", 16, [], "111", "Destination Index", "Index register"),
    new Register("SP", 16, [], "100", "Stack Pointer", "Index register"),
    new Register("BP", 16, [], "101", "Base Pointer", "Index register"),
    new Register("CS", 16, ["S"], "01", "Code Segment", "Segment register"),
    new Register("DS", 16, ["S"], "11", "Data Segment", "Segment register"),
    new Register("ES", 16, ["S"], "00", "Extra Segment", "Segment register"),
    new Register("SS", 16, ["S"], "10", "Stack Segment", "Segment register")
];

//TODO: Add what instructions they are valid for
const Prefixs = [
    {"prefix": "LOCK", "name": "Lock (Preform as atomic)"},
    {"prefix": "REP", "name": "Repeat for Count"},
    {"prefix": "REPE", "name": "Repeat for Count or Equal"},
    {"prefix": "REPZ", "name": "Repeat for Count or Zero"},
    {"prefix": "REPNE", "name": "Repeat for Count or Not Equal"},
    {"prefix": "REPNZ", "name": "Repeat for Count or Not Zero"}
];

const Instructions = [
    {"instruction": "AAA", "name": "ASCII adjust AL after addition"},
    {"instruction": "AAD", "name": "ASCII adjust AX before division"},
    {"instruction": "AAM", "name": "ASCII adjust AX after multiplication"},
    {"instruction": "AAS", "name": "ASCII adjust AL after subtraction"},
    {
        "instruction": "ADC",
        "name": "Add with carry",
        "operandCount": 2,
        "opcodes": [
            {"code": "10", "operands": ["G", "E"], "size": 8},
            {"code": "11", "operands": ["G", "E"], "size": 16},
            {"code": "12", "operands": ["E", "G"], "size": 8},
            {"code": "13", "operands": ["E", "G"], "size": 16}
        ]},
    {
        "instruction": "ADD",
        "name": "Add",
        "operandCount": 2,
        "opcodes": [
            {"code": "0000000011rrrrrr", "operands": ["G", "G"], "size": 8}, //1 -> 2
            {"code": "0000000111rrrrrr", "operands": ["G", "G"], "size": 16},//1 -> 2
            {"code": "00000000mmrrrrrr", "operands": ["G", "M"], "size": 8}, //1 -> 2
            {"code": "00000001mmrrrrrr", "operands": ["G", "M"], "size": 16},//1 -> 2
            {"code": "0000001011rrrrrr", "operands": ["G", "G"], "size": 8}, //2 -> 1
            {"code": "0000001111rrrrrr", "operands": ["G", "G"], "size": 16},//2 -> 1
            {"code": "00000010mmrrrrrr", "operands": ["G", "M"], "size": 8}, //2 -> 1
            {"code": "00000011mmrrrrrr", "operands": ["G", "M"], "size": 16},//2 -> 1
            {"code": "1000000011000rrr", "operands": ["G", "I"], "size": 8}, //I -> R
            {"code": "10000000mm100rrr", "operands": ["M", "I"], "size": 8}, //I -> M
            {"code": "1000000111000rrr", "operands": ["G", "I"], "size": 16},//I -> R
            {"code": "10000001mm100rrr", "operands": ["M", "I"], "size": 16},//I -> M
            //sign extend version
            //{"code": "10000010", "operands": ["E", "I"], "size": 8},
            //{"code": "10000011", "operands": ["E", "I"], "size": 16}
        ],
        "getCode": function (op, op1, op2) {
            const opcode = this.opcodes[op];
            let out = opcode.code.replace("rrr", op1.regBits);

            if (this.opcodes[op].operands[1] === "I") {
                out = out + op2.getBytes(opcode.size);
            } else {
                out = out.replace("rrr", op2.regBits);
            }

            return out;
        }
    },
    {"instruction": "AND", "name": "Logical AND"},
    {"instruction": "CALL", "name": "Call procedure"},
    {"instruction": "CBW", "name": "Convert byte to word"},
    {"instruction": "CLC", "name": "Clear carry flag"},
    {"instruction": "CLD", "name": "Clear direction flag"},
    {"instruction": "CLI", "name": "Clear interrupt flag"},
    {"instruction": "CMC", "name": "Complement carry flag"},
    {"instruction": "CMP", "name": "Compare operands"},
    {"instruction": "CMPSB", "name": "Compare bytes in memory"},
    {"instruction": "CMPSW", "name": "Compare words"},
    {"instruction": "CWD", "name": "Convert word to doubleword"},
    {"instruction": "DAA", "name": "Decimal adjust AL after addition"},
    {"instruction": "DAS", "name": "Decimal adjust AL after subtraction"},
    {"instruction": "DEC", "name": "Decrement by 1"},
    {"instruction": "DIV", "name": "Unsigned divide"},
    {"instruction": "ESC", "name": "Used with floating-point unit"},
    {"instruction": "HLT", "name": "Enter halt state"},
    {"instruction": "IDIV", "name": "Signed divide"},
    {"instruction": "IMUL", "name": "Signed multiply"},
    {"instruction": "IN", "name": "Input from port"},
    {
        "instruction": "INC",
        "name": "Increment by 1",
        "operandCount": 1,
        "opcodes": [
            {"code": "1111111011000rrr", "operands": ["G"], "size": 8}, // AL, AH, BL, BH, etc
            {"code": "01000rrr", "operands": ["G"], "size": 16}, // AX, BX, CX, DX only
        ],
        "getCode": function (op, op1) {
            const opcode = this.opcodes[op];
            let out = opcode.code.replace("rrr", op1.regBits);
            return out;
        }
    },
    {"instruction": "INT", "name": "Call to interrupt"},
    {"instruction": "INTO", "name": "Call to interrupt if overflow"},
    {"instruction": "IRET", "name": "Return from interrupt"},
    {"instruction": "JA", "name": "Jump if Above"},
    {"instruction": "JNA", "name": "Jump if Not Above"},
    {"instruction": "JAE", "name": "Jump if Above or Equal"},
    {"instruction": "JNAE", "name": "Jump if Not Above or Equal"},
    {"instruction": "JB", "name": "Jump if Below"},
    {"instruction": "JNB", "name": "Jump if Not Below"},
    {"instruction": "JBE", "name": "Jump if Below or Equal"},
    {"instruction": "JNBE", "name": "Jump if Not Below or Equal"},
    {"instruction": "JC", "name": "Jump if Carry Flag Set"},
    {"instruction": "JNC", "name": "Jump if Carry Flag Not Set"},
    {"instruction": "JE", "name": "Jump if Equal"},
    {"instruction": "JNE", "name": "Jump if Not Equal"},
    {"instruction": "JG", "name": "Jump if Greater"},
    {"instruction": "JNG", "name": "Jump if Not Greater"},
    {"instruction": "JGE", "name": "Jump if Greater or Equal"},
    {"instruction": "JNGE", "name": "Jump if Not Greater or Equal"},
    {"instruction": "JL", "name": "Jump if Less"},
    {"instruction": "JNL", "name": "Jump if Not Less"},
    {"instruction": "JLE", "name": "Jump if Less or Equal"},
    {"instruction": "JNLE", "name": "Jump if Not Less or Equal"},
    {"instruction": "JO", "name": "Jump if Overflow"},
    {"instruction": "JNO", "name": "Jump if Not Overflow"},
    {"instruction": "JP", "name": "Jump if Parity"},
    {"instruction": "JNP", "name": "Jump if Not Parity"},
    {"instruction": "JPE", "name": "Jump if Parity Even"},
    {"instruction": "JPO", "name": "Jump if Parity Odd"},
    {"instruction": "JS", "name": "Jump if Sign (Negative)"},
    {"instruction": "JNS", "name": "Jump if Not Sign (Positive)"},
    {"instruction": "JZ", "name": "Jump if Zero"},
    {"instruction": "JNZ", "name": "Jump if Not Zero"},
    {"instruction": "JCXZ", "name": "Jump if CX is zero"},
    {"instruction": "JMP", "name": "Jump"},
    {"instruction": "LAHF", "name": "Load flags into AH register"},
    {"instruction": "LDS", "name": "Load pointer using DS"},
    {"instruction": "LEA", "name": "Load Effective Address"},
    {"instruction": "LES", "name": "Load ES with pointer"},
    {"instruction": "LOCK", "name": "Assert BUS LOCK# signal"},
    {"instruction": "LODSB", "name": "Load string byte"},
    {"instruction": "LODSW", "name": "Load string word"},
    {"instruction": "LOOP", "name": "Loop control"},
    {"instruction": "LOOPE", "name": "Loop control and Equal"},
    {"instruction": "LOOPNE", "name": "Loop control and Not Equal"},
    {"instruction": "LOOPZ", "name": "Loop control and Zero"},
    {"instruction": "LOOPNZ", "name": "Loop control and Not Zero"},
    {
        "instruction": "MOV",
        "name": "Move",
        "operandCount": 2,
        "opcodes": [
            {"code": "1000100011rrrrrr", "operands": ["G", "G"], "size": 8}, //1 -> 2
            {"code": "1000100111rrrrrr", "operands": ["G", "G"], "size": 16},//1 -> 2
            {"code": "1000101011rrrrrr", "operands": ["G", "G"], "size": 8}, //2 -> 1
            {"code": "1000101111rrrrrr", "operands": ["G", "G"], "size": 16},//2 -> 1
            {"code": "10001000mmrrrrrr", "operands": ["G", "M"], "size": 8}, //1 -> 2
            {"code": "10001001mmrrrrrr", "operands": ["G", "M"], "size": 16},//1 -> 2
            {"code": "10001010mmrrrrrr", "operands": ["G", "M"], "size": 8}, //2 -> 1
            {"code": "10001011mmrrrrrr", "operands": ["G", "M"], "size": 16},//2 -> 1
            {"code": "1100011011000rrr", "operands": ["G", "I"], "size": 8}, //I -> R
            {"code": "1100011111000rrr", "operands": ["G", "I"], "size": 16},//I -> R
            //{"code": "10000000mm100rrr", "operands": ["M", "I"], "size": 8}, //I -> M
            //{"code": "10000001mm100rrr", "operands": ["M", "I"], "size": 16},//I -> M
            //sign extend version
            //{"code": "10000010", "operands": ["E", "I"], "size": 8},
            //{"code": "10000011", "operands": ["E", "I"], "size": 16}
        ],
        "getCode": function (op, op1, op2) {
            const opcode = this.opcodes[op];
            let out = opcode.code.replace("rrr", op1.regBits);

            if (this.opcodes[op].operands[1] === "I") {
                out = out + op2.getBytes(opcode.size);
            } else {
                out = out.replace("rrr", op2.regBits);
            }

            return out;
        }
    },
    {"instruction": "MOVSB", "name": "Move byte from string to string"},
    {"instruction": "MOVSW", "name": "Move word from string to string"},
    {"instruction": "MUL", "name": "Unsigned multiply"},
    {"instruction": "NEG", "name": "Two's complement negation"},
    {"instruction": "NOP", "name": "No operation"},
    {"instruction": "NOT", "name": "Negate the operand, logical NOT"},
    {"instruction": "OR", "name": "Logical OR"},
    {"instruction": "OUT", "name": "Output to port"},
    {"instruction": "POP", "name": "Pop data from stack"},
    {"instruction": "POPF", "name": "Pop data from flags register"},
    {"instruction": "PUSH", "name": "Push data onto stack"},
    {"instruction": "PUSHF", "name": "Push flags onto stack"},
    {"instruction": "RCL", "name": "Rotate left (with carry)"},
    {"instruction": "RCR", "name": "Rotate right (with carry)"},
    {"instruction": "RET", "name": "Return from procedure"},
    {"instruction": "RETN", "name": "Return from near procedure"},
    {"instruction": "RETF", "name": "Return from far procedure"},
    {"instruction": "ROL", "name": "Rotate left"},
    {"instruction": "ROR", "name": "Rotate right"},
    {"instruction": "SAHF", "name": "Store AH into flags"},
    {"instruction": "SAL", "name": "Shift Arithmetically left (signed shift left)"},
    {"instruction": "SAR", "name": "Shift Arithmetically right (signed shift right)"},
    {
        "instruction": "SBB",
        "name": "Subtraction with borrow",
        "operandCount": 2,
        "opcodes": [
            {"code": "18", "operands": ["G", "E"], "size": 8},
            {"code": "19", "operands": ["G", "E"], "size": 16},
            {"code": "1A", "operands": ["E", "G"], "size": 8},
            {"code": "1B", "operands": ["E", "G"], "size": 16}
        ]},
    {"instruction": "SCASB", "name": "Compare byte string"},
    {"instruction": "SCASW", "name": "Compare word string"},
    {"instruction": "SHL", "name": "Shift left (unsigned shift left)"},
    {"instruction": "SHR", "name": "Shift right (unsigned shift right)"},
    {"instruction": "STC", "name": "Set carry flag"},
    {"instruction": "STD", "name": "Set direction flag"},
    {"instruction": "STI", "name": "Set interrupt flag"},
    {"instruction": "STOSB", "name": "Store byte in string"},
    {"instruction": "STOSW", "name": "Store word in string"},
    {
        "instruction": "SUB",
        "name": "Subtraction",
        "operandCount": 2,
        "opcodes": [
            {"code": "28", "operands": ["G", "E"], "size": 8},
            {"code": "29", "operands": ["G", "E"], "size": 16},
            {"code": "2A", "operands": ["E", "G"], "size": 8},
            {"code": "2B", "operands": ["E", "G"], "size": 16}
        ]},
    {"instruction": "TEST", "name": "Logical compare (AND)"},
    {"instruction": "WAIT", "name": "Wait until not busy"},
    {"instruction": "XCHG", "name": "Exchange data"},
    {"instruction": "XLAT", "name": "Table look-up translation"},
    {
        "instruction": "XOR",
        "name": "Exclusive OR",
        "operandCount": 2,
        "opcodes": [
            {code: "34"}
        ]
    }
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

function copyData(from, to) {
    for (let attr in from) {
        if (from.hasOwnProperty(attr))
            to[attr] = from[attr];
    }
}

function Label(str) {
    const label = str;
    this.toString = function() {
        return "Label (" + label.fontcolor("grey") + ") ";
    };
}

function Prefix(str) {
    const prefix = str;
    this.toString = function() {
        return "Prefix (" + prefix.fontcolor("aqua") + ")";
    };
}

function Instruction(instruction) {
    copyData(instruction, this);

    this.toString = function() {
        return "Instruction (" + this.instruction.fontcolor("blue") + ")";
    };
}

function Comma() {
    this.toString = function() {
        return ",";
    };
}

function Newline() {
    this.toString = function() {
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
                        for (j = 0; j < Prefixs.length; j++) {
                            if (Prefixs[j].prefix === tok) {
                                return new Prefix(tok);
                            }
                        }
                        for (j = 0; j < Instructions.length; j++) {
                            if (Instructions[j].instruction === tok) {
                                return new Instruction(Instructions[j]);
                            }
                        }
                        for (j = 0; j < Registers.length; j++) {
                            if (Registers[j].register === tok) {
                                return Registers[j];
                            }
                        }

                        return tok;
                    }
                } else if (/^[0-9]$/i.test(val)) {
                    return new Immediate(this.scanner.getChars([" ", ";", "\n", "\t", ","]));
                } else if (/^[;]$/i.test(val)) {
                    this.scanner.skipChars(["\n"]);
                    //this.tokens.push(new Comment());
                } else if (/^[,]$/i.test(val)) {
                    this.scanner.skipChar();
                    return new Comma();
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

function Parse(text) {
    const tokeniser = new Tokeniser(text);
    const tokens = [];
    let codeOut = "";

    while (tokeniser.hasMoreTokens()) {
        var token = tokeniser.nextToken();
        tokens.push(token);
        codeOut += token.toString() + " ";// + "<br/>";
    }

    this.asm = codeOut;
    this.tokens = tokens;
}


function assemble(tokens) {
    function moreTokens() {
        return 0 !== tokens.length;
    }

    function getToken() {
        return tokens.shift();
    }

    var output = "", hexOutput = "", opcode, bitCount, token, prefix, instruction, operands, ok, j;

    try {
        while (moreTokens()) {
            token = getToken();
            prefix = null;

            if (token instanceof Prefix) {
                prefix = token;
                output += "Prefixes not yet supported.<br/>";
                token = getToken();
            }

            if (token instanceof Instruction) {
                instruction = token;
                operands = [];
                if (instruction.operandCount !== undefined) {
                    ok = true;

                    for (j = 0; j < instruction.operandCount; j++) {
                        token = getToken();

                        if (token === undefined) {
                            break;
                        }

                        if (j !== 0) {
                            if (!(token instanceof Comma)) {
                                output += "Bad format for: " + instruction.toString() + "<br/>";
                                output += "Expected comma, found: " + token.toString() + "<br/>";
                                ok = false;
                                break;
                            } else {
                                token = getToken();
                            }
                        }

                        if (token instanceof Operand) {
                            operands.push(token);
                        } else {
                            output += "Bad format for: " + instruction.toString() + "<br/>";
                            output += "Expected operand, found: " + token.toString() + "<br/>";
                            ok = false;
                            break;
                        }
                    }

                    if (ok) {
                        output += instruction.toString() + "<br/>";
                        opcode = null;
                        bitCount = operands[0].bits;
                        for (var l = 0; l < instruction.opcodes.length; l++) {
                            var code = instruction.opcodes[l];
                            var validOp = false;
                            if (code.size == bitCount && code.operands.length == operands.length) {
                                validOp = true;
                                for (var k = 0; k < operands.length; k++) {
                                    if (-1 == operands[k].types.indexOf(code.operands[k])) {
                                        validOp = false;
                                        break;
                                    }
                                }
                            }

                            if (validOp == true) {
                                if (instruction.getCode) {
                                    output += instruction.getCode(l, operands[0], operands[1]) + "<br/>";
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
                    output += "Instruction not yet supported: " + instruction.toString() + "<br/>";

                    while (!(tokens[0] instanceof Prefix || tokens[0] instanceof Instruction) && 0 !== tokens.length) {
                        token = getToken();
                        output += "Ignoring tokens until instruction found: " + token.toString() + "<br/>";
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

    return output;
}

function Ctrl($scope, $log, $sce) {
    $scope.codeView = function() {
        var parse = new Parse($scope.code);
        $scope.asm = parse.asm;
        $scope.tokens = parse.tokens;
        return $sce.trustAsHtml($scope.asm);
    };

    $scope.machineView = function() {
        $scope.machine = assemble($scope.tokens.slice());
        return $sce.trustAsHtml($scope.machine);
    };

    $scope.code = "ADD AX, 0\nMOV AX, CX\nINC AX\nlabel:\nXOR AX, 01010101b\nAND BX, 0FFh";
}


Registers = [
    {"register": "AL", "types": ["G","E"], "Name": "AL", "Type": "Main Register", "bits": 8},
    {"register": "BL", "types": ["G","E"], "Name": "BL", "Type": "Main Register", "bits": 8},
    {"register": "CL", "types": ["G","E"], "Name": "CL", "Type": "Main Register", "bits": 8},
    {"register": "DL", "types": ["G","E"], "Name": "DL", "Type": "Main Register", "bits": 8},
    {"register": "AH", "types": ["G","E"], "Name": "AH", "Type": "Main Register", "bits": 8},
    {"register": "BH", "types": ["G","E"], "Name": "BH", "Type": "Main Register", "bits": 8},
    {"register": "CH", "types": ["G","E"], "Name": "CH", "Type": "Main Register", "bits": 8},
    {"register": "DH", "types": ["G","E"], "Name": "DH", "Type": "Main Register", "bits": 8},
    {"register": "AX", "types": ["G","E"], "Name": "AX", "Type": "Main Register", "bits": 16},
    {"register": "BX", "types": ["G","E"], "Name": "BX", "Type": "Main Register", "bits": 16},
    {"register": "CX", "types": ["G","E"], "Name": "CX", "Type": "Main Register", "bits": 16},
    {"register": "DX", "types": ["G","E"], "Name": "DX", "Type": "Main Register", "bits": 16},
    {"register": "SI", "Name": "Source Index", "Type": "Index register", "bits": 16},
    {"register": "DI", "Name": "Destination Index", "Type": "Index register", "bits": 16},
    {"register": "SP", "Name": "Stack Pointer", "Type": "Index register", "bits": 16},
    {"register": "BP", "Name": "Base Pointer", "Type": "Index register", "bits": 16},
    {"register": "CS", "types": ["S"], "Name": "Code Segment", "Type": "Segment register", "bits": 16},
    {"register": "DS", "types": ["S"], "Name": "Data Segment", "Type": "Segment register", "bits": 16},
    {"register": "ES", "types": ["S"], "Name": "Extra Segment", "Type": "Segment register", "bits": 16},
    {"register": "SS", "types": ["S"], "Name": "Stack Segment", "Type": "Segment register", "bits": 16}
];

//TODO: Add what instructions they are valid for
Prefixs = [
    {"prefix": "LOCK", "name": "Lock (Preform as atomic)"},
    {"prefix": "REP", "name": "Repeat for Count"},
    {"prefix": "REPE", "name": "Repeat for Count or Equal"},
    {"prefix": "REPZ", "name": "Repeat for Count or Zero"},
    {"prefix": "REPNE", "name": "Repeat for Count or Not Equal"},
    {"prefix": "REPNZ", "name": "Repeat for Count or Not Zero"}
];

Instructions = [
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
            {"code": "00", "operands": ["G", "E"], "size": 8},
            {"code": "01", "operands": ["G", "E"], "size": 16},
            {"code": "02", "operands": ["E", "G"], "size": 8},
            {"code": "03", "operands": ["E", "G"], "size": 16}
        ]},
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
    {"instruction": "INC", "name": "Increment by 1"},
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
    {"instruction": "MOV", "name": "Move"},
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
    {"instruction": "XOR", "name": "Exclusive OR"}
];

function Scanner(code) {
    this.code = code + "";
    this.pos = 0;
    var whitespace = [" ", "\t"];

    this.isEof = function() {
        return this.code.length <= this.pos;
    };

    this.getCurrentChar = function() {
        return this.code.charAt(this.pos);
    };

    this.skipChar = function() {
        this.pos++;
    };

    this.skipChars = function(skipChars) {
        var data = this.code;
        var i = this.pos;

        for (; i < data.length; i++) {
            var value = data.charAt(i);

            if (-1 === skipChars.indexOf(value)) {
                break;
            }
        }

        this.pos = i;
    };

    this.getChars = function(endChars) {
        var data = this.code;
        var i = this.pos;

        for (; i < data.length; i++) {
            var value = data.charAt(i);

            if (-1 !== endChars.indexOf(value)) {
                break;
            }
        }

        var returnVal = data.substring(this.pos, i);
        this.pos = i;

        return returnVal;
    };

    this.lookChars = function(endChars) {
        var data = this.code;
        var i = this.pos;

        for (; i < data.length; i++) {
            var value = data.charAt(i);

            if (-1 !== endChars.indexOf(value)) {
                break;
            }
        }

        var returnVal = data.substring(this.pos, i);

        return returnVal;
    };

    this.skipWhitespace = function() {
        this.skipChars(whitespace);
    };
}

function copyData(from, to) {
    for (var attr in from) {
        if (from.hasOwnProperty(attr))
            to[attr] = from[attr];
    }
}

function Label(str) {
    var label = str;
    this.toString = function() {
        return "Label (" + label.fontcolor("grey") + ") ";
    };
}

function Prefix(str) {
    var prefix = str;
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

function Operand() {
}

function Register(register) {
    copyData(register, this);

    this.toString = function() {
        return "Register (" + this.register.fontcolor("green") + ")";
    };
}

Register.prototype = new Operand();

function Immediate(str) {
    var number = str;
    var type = "";
    var lastChar = number[number.length - 1];
    if (lastChar === "b") {
        type = "Binary";
    } else if (lastChar === "o") {
        type = "Octal";
    } else if (lastChar === "h") {
        type = "Hexadecimal";
    } else {
        type = "Decimal";
    }

    this.toString = function() {
        return type + " Number (" + number.fontcolor("red") + ")";
    };
}

Immediate.prototype = new Operand();

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

function Tokeniser(code) {
    this.tokens = [];
    this.token = 0;

    var scanner = new Scanner(code);

    this.nextToken = function() {
        while (!scanner.isEof()) {
            scanner.skipWhitespace();
            if (!scanner.isEof()) {
                var val = scanner.getCurrentChar();
                if (/^[a-z]$/i.test(val)) {
                    var tok = scanner.getChars([" ", ";", "\n", "\t", ","]);
                    if (tok.indexOf(":", tok.length - 1) !== -1) {
                        return new Label(tok.substring(0, tok.length - 1));
                    } else {
                        for (var j = 0; j < Prefixs.length; j++) {
                            if (Prefixs[j].prefix === tok) {
                                return new Prefix(tok);
                            }
                        }
                        for (var j = 0; j < Instructions.length; j++) {
                            if (Instructions[j].instruction === tok) {
                                return new Instruction(Instructions[j]);
                            }
                        }
                        for (var j = 0; j < Registers.length; j++) {
                            if (Registers[j].register === tok) {
                                return new Register(Registers[j]);
                            }
                        }

                        return tok;
                    }
                } else if (/^[0-9]$/i.test(val)) {
                    return new Immediate(scanner.getChars([" ", ";", "\n", "\t", ","]));
                } else if (/^[;]$/i.test(val)) {
                    scanner.skipChars(["\n"]);
                    //this.tokens.push(new Comment());
                } else if (/^[,]$/i.test(val)) {
                    scanner.skipChar();
                    return new Comma();
                } else if (/^[\n]$/i.test(val)) {
                    scanner.skipChar();
                    return new Newline();
                } else {
                    scanner.skipChar();
                    console.log("Unknown char: '" + val + "' char value: " + val.charCodeAt(0));
                }
            }
        }
        return "";
    };

    this.hasMoreTokens = function() {
        return !scanner.isEof();
    };
}

function Parse(text) {
    var tokeniser = new Tokeniser(text);
    var tokens = [];
    var codeOut = "";

    while (tokeniser.hasMoreTokens()) {
        var token = tokeniser.nextToken();
        tokens.push(token);
        codeOut += token.toString() + " ";// + "<br/>";
    }

    this.asm = codeOut;
    this.tokens = tokens;
}


function Assemble(tokens) {
    function getToken() {
        var t = tokens[0];
        tokens.shift();
        return t;
    }

    var output = "";

    while (0 !== tokens.length) {
        var token = getToken();

        var prefix = null;

        if (token instanceof Prefix) {
            prefix = token;
            output += "Prefixes not yet supported.<br/>";
            token = getToken();
        }

        if (token instanceof Instruction) {
            var instruction = token;
            var operands = [];
            if (instruction.operandCount !== undefined) {
                var ok = true;

                for (var j = 0; j < instruction.operandCount; j++) {
                    token = getToken();

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
                    //output += instruction.toString() + "<br/>";
                    var opcode = null;
                    bitCount = operands[0].bits;
                    for (var l=0; l<instruction.opcodes.length; l++) {
                        var code = instruction.opcodes[l];
                        var validOp = false;
                        if (code.size == bitCount && code.operands.length == operands.length) {
                            validOp = true;
                            for (var k=0; k<operands.length; k++) {
                                if (-1 == operands[k].types.indexOf(code.operands[k])) {
                                    validOp = false;
                                    break;
                                }
                            }
                        }
                        
                        if (validOp == true) {
                            output += code.code + "<br/>";
                            break;
                        }
                    }
                }
                
                // Match newline
                if (tokens[0] instanceof Newline) {
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

    return output;
}

function Ctrl($scope, $log) {
    $scope.codeView = function() {
        var parse = new Parse($scope.code);
        $scope.asm = parse.asm;
        $scope.tokens = parse.tokens;
        return $scope.asm;
    };

    $scope.machineView = function() {
        return Assemble($scope.tokens);//$scope.asm;
    };

    $scope.code = "MOV AX, CX\nINC AX\nlabel:\nXOR AX, 01010101b\nAND BX, 0FFh";
}


"use strict";

export class Instruction {
    constructor (instruction, name, operandCount, opcodes, getCode) {
        this.key = instruction;
        this.name = name;
        this.operandCount = operandCount;
        this.opcodes = opcodes;
        this.toCode = getCode;
        this.type = "INSTRUCTION";
    }

    toString () {
        return `Instruction (${this.key})`;
    }
}

export const instructions = [
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

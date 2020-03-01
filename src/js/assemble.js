"use strict";

import {Immediate, PlaceholderImmediate} from "./immediate";
import {Label} from "./tokeniser";

export function assemble(statements) {
    const labels = [];
    const placeholders = [];
    const binaryOutput = [];
    const errors = [];
    const addError = (position, error) => errors.push(`Statement ${position}: ${error}`);

    let orgOffset = 0;

    for (let position = 0; statements.length > position; position++) {
        let statement = statements[position];

        if (statement.labels.length > 0) {
            const position = binaryOutput.map((bits) => bits.length).reduce((sum, bits) => sum + bits, 0) / 8;
            labels.push.apply(labels, statement.labels.map((label) => {return {label, position}}));
        }

        switch (statement.getType()) {
            case "DIRECTIVE":
                const directive = statement.directive;
                const parameters = statement.parameters;

                if (directive.key === "ORG") {
                    if (parameters.length === 1 && parameters[0] instanceof Immediate) {
                        orgOffset = parameters[0].value;
                    } else {
                        addError(position, "ORG directive must have a single parameter of type immediate.");
                    }
                } else {
                    if (directive.paramCount !== parameters.length) {
                        addError(position, `${directive.key} expects ${directive.paramCount} parameters not ${parameters.length}`);
                    }
                    binaryOutput.push(`${directive.toCode(...parameters)}`);
                }
                break;
            case "INSTRUCTION":
                const prefix = statement.prefix;
                const instruction = statement.instruction;
                const operands = statement.operands;
                let placeholder = false;

                // swap out any labels for PlaceholderImmediates so we can switch in the value later
                for (let i=0; i<operands.length; i++) {
                    const operand = operands[i];
                    if (operand instanceof Label) {
                        const immediate = new PlaceholderImmediate(operand);
                        immediate.bits = 16;
                        placeholders.push({instruction, opcode: null, operands, position: binaryOutput.length});
                        operands[i] = immediate;
                        placeholder = true;
                        break;
                    }
                }

                if (prefix) {
                    addError(position, "Prefixes are not yet supported, prefix ignored!");
                }
                if (!instruction.opcodes) {
                    addError(position, "Instruction not yet supported, instruction ignored!");
                } else {
                    const opcodes = instruction.opcodes;
                    let matched = false;
                    for (let i = 0; i < opcodes.length; i++) {
                        const opcode = instruction.opcodes[i];
                        const matchCodes = operands.map((operand, j) => {
                            return operand.bits === opcode.size && operand.types.includes(opcode.operands[j])
                        });
                        const match = matchCodes.reduce((a, b) => a && b, true);

                        if (match) {
                            if (placeholder) {
                                placeholders[placeholders.length - 1].opcode = i;
                            }
                            binaryOutput.push(instruction.toCode(i, ...operands));
                            matched = true;
                            break;
                        }
                    }
                    if (!matched) {
                        addError(position, "Unable to match instruction and operands to opcode.");
                    }
                }
                break;
            case "UNKNOWN":
                addError(position, "Unable to parse statement.");
                break;
        }
    }

    // loop through placeholders to lookup values
    placeholders.forEach((placeholder) => {
        const fixedOperands = placeholder.operands.map((operand) => {
            if (operand instanceof PlaceholderImmediate) {
                const position = placeholder.position;
                const label = operand.label;
                const posLabel = labels.filter((labelEntry) => labelEntry.label.label === label.label);
                switch (posLabel.length) {
                    case 0:
                        addError(position, `No label definition found during 2 pass processing: ${label.label}`);
                        return operand;
                    case 1:
                        return new Immediate(posLabel[0].position + orgOffset);
                    default:
                        addError(position, `Multiple label definitions found during 2 pass processing: ${label.label}`);
                        return operand;
                }
            }
            return operand;
        });
        // replace binary output of code with fixed offset
        const opcode = placeholder.opcode;
        binaryOutput[placeholder.position] = placeholder.instruction.toCode(opcode, ...fixedOperands);
    });

    return {
        binaryOutput,
        errors
    }
}

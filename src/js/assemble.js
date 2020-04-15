"use strict";

import {Immediate, PlaceholderImmediate} from "./immediate";
import {Label} from "./tokeniser";
import {FormatCOM, FormatMZ} from "./formats";

export function assemble(statements) {
    try {
        // default to COM format
        let format = new FormatCOM();

        const errors = [];
        const addError = (position, error) => errors.push(`Statement ${position}: ${error}`);

        for (let position = 0; statements.length > position; position++) {
            let statement = statements[position];

            if (statement.labels.length > 0) {
                statement.labels.forEach((label) => format.addLabel(label));
            }

            switch (statement.getType()) {
                case "DIRECTIVE":
                    const directive = statement.directive;
                    const parameters = statement.parameters;

                    // validate directive
                    if (!directive.acceptParams && parameters.length !== 0) {
                        addError(position, `${directive.key} doesn't expect parameters had ${parameters.length} parameters`);
                    } else if (directive.acceptParams && parameters.length === 0) {
                        addError(position, `${directive.key} expects parameters but had ${parameters.length} parameters`);
                    } else {
                        // If it's a format directive, load the correct format
                        if (directive.key === "FORMAT") {
                            switch (parameters[0].label) {
                                case "binary":
                                    format = new FormatCOM();
                                    break;
                                case "MZ":
                                    format = new FormatMZ();
                                    break;
                                default:
                                    addError(position, `${directive.key} provided is unsupported or unknown (${parameters[0]})`);
                                    break;
                            }
                        } else {
                            // check if directive is supported by this type of format
                            if (format.isValidDirective(directive)) {
                                format.handleDirective(directive, parameters);
                            } else {
                                addError(position, `${directive.key} is not supported in format ${format.name}`);
                            }
                        }
                    }
                    break;
                case "INSTRUCTION":
                    const prefix = statement.prefix;
                    const instruction = statement.instruction;
                    const operands = statement.operands;
                    let placeholder = false;

                    // swap out any labels for PlaceholderImmediates so we can switch in the value later
                    for (let i = 0; i < operands.length; i++) {
                        const operand = operands[i];
                        if (operand instanceof Label) {
                            const immediate = new PlaceholderImmediate(operand);
                            immediate.bits = 16;
                            format.addPlaceholder(instruction, operands);
                            operands[i] = immediate;
                            placeholder = true;
                        }
                    }

                    if (prefix) {
                        addError(position, `Prefixes are not yet supported, ${prefix.key} ignored!`);
                    }
                    if (!instruction.opcodes) {
                        addError(position, `Instruction not yet supported, ${instruction.key} ignored!`);
                    } else if (!instruction.opcodes) {
                        addError(position, `Instruction code generation not supported yet, ${instruction.key} ignored!`);
                    } else {
                        const opcodes = instruction.opcodes;
                        let matched = false;
                        try {
                            const opCode = instruction.findOpCode(operands);

                            if (opCode) {
                                if (placeholder) {
                                    format.placeholders[format.placeholders.length - 1].opcode = opCode;
                                }
                                format.binaryOutput.push(opCode.getBytes(operands));
                                matched = true;
                            }

                            // for (let i = 0; i < opcodes.length; i++) {
                            //
                            //     const opcode = instruction.opcodes[i];
                            //     // ensure provided operands and expected operands match
                            //     if ((operands.length === 0 && opcode.operands.length === 0) || (opcode.operands && operands.length === opcode.operands.length)) {
                            //         const matchCodes = operands.map((operand, j) => {
                            //             return operand.bits === opcode.size && operand.types.includes(opcode.operands[j])
                            //         });
                            //         const match = matchCodes.reduce((a, b) => a && b, true);
                            //
                            //         if (match) {
                            //             if (placeholder) {
                            //                 format.placeholders[format.placeholders.length - 1].opcode = i;
                            //             }
                            //             format.binaryOutput.push(instruction.toCode(i, ...operands));
                            //             matched = true;
                            //             break;
                            //         }
                            //     }
                            // }
                        } catch (e) {
                            console.log(e);
                        }
                        if (!matched) {
                            addError(position, `Unable to match instruction (${instruction.key}) and operands (${operands.map((o) => o.key).join(", ")}) to opcode.`);
                        }
                    }
                    break;
                case "UNKNOWN":
                    addError(position, "Unable to parse statement.");
                    break;
            }
        }

        // loop through placeholders to lookup values
        format.regenPlaceholders();

        format.regenerateHeader();
        // regenerate second time for correct segment positions in MZ
        format.regenerateHeader();

        const binaryOutput = format.binaryOutput;
        const bin = binaryOutput.join("");
        const formattedBin = [];
        let formattedLine = "";
        let i = 0;
        let j = 0;
        for (; i < bin.length; i += 8, j++) {
            formattedLine += bin.substr(i, 8) + " ";

            if (j === 5) {
                let posNum = (i / 8 - j).toString(16);
                if (posNum.length < 2) {
                    posNum = "0" + posNum;
                }
                formattedBin.push(posNum + ": " + formattedLine);
                formattedLine = "";
                j = -1;
            }
        }

        if (formattedLine.length > 0) {
            let posNum = (i / 8 - j).toString(16);
            if (posNum.length < 2) {
                posNum = "0" + posNum;
            }
            formattedBin.push(posNum + ": " + formattedLine);
        }

        return {
            binaryOutput,
            errors,
            formattedBin
        }
    } catch (e) {
        console.error(e);
        return {binaryOutput: [], errors: [e]};
    }
}

"use strict";

import {Bracket, Comma, Colon, Label, NewLine, StrToken, Plus} from "./tokeniser";
import {Directive} from "./directive";
import {Prefix} from "./prefix";
import {Immediate, PlaceholderImmediate} from "./immediate";
import {Instruction} from "./instruction";
import {Register} from "./register";
import {Memory} from "./memory";

class Statement {
    constructor () {
        this.labels = [];
        this.directive = null;
        this.parameters = [];
        this.prefix = null;
        this.instruction = null;
        this.operands = [];
        this.unknown = [];
    }

    addLabel (label) {
        this.labels.push(label);
    }

    addParameter (parameter) {
        this.parameters.push(parameter);
    }

    addOperand (operand) {
        this.operands.push(operand);
    }

    addUnknown (unknown) {
        this.unknown.push(unknown);
    }

    getType () {
        return !this.directive ? (!this.instruction ? "UNKNOWN" : "INSTRUCTION") : "DIRECTIVE";
    }

    toString () {
        let output = [];
        output.concat(this.labels.map(label => label.toString()));
        if (this.directive) {
            output.push(this.directive.toString());
            output.push.apply(output, this.parameters.map(param => param.toString()));
        } else if (this.instruction) {
            if (this.prefix) {
                output.push(this.prefix.toString());
            }
            output.push(this.instruction.toString());
            output.push.apply(output, this.operands.map(param => param.toString()));
        }
        if (this.unknown.length > 0) {
            output.push("Unknown:");
            output.push.apply(output, this.unknown.map(unknown => unknown.toString()));
        }
        return output.join(" ");
    }
}

export function parse (tokens) {
    let position = 0;
    const getNext = () => tokens[++position];
    const lookNext = () => tokens[position + 1];
    const statements = [];

    while (tokens.length > position) {
        let token = tokens[position];

        // parse a statement
        const statement = new Statement();
        //statement -> [labels+] (directive... | [prefix] instruction operand [, operand]) \n
        //directive -> directive parameter [, parameter]
        //parameter -> (immediate | string)
        //operand -> (memory | register | immediate | label)  //todo: handle pointer
        //memory -> \[register | immediate\]

        while (token instanceof Label) {
            statement.addLabel(token);
            token = getNext();
            // labels followed by instructions should have a colon, labels followed by a directive don't
            if (token instanceof Colon) {
                token = getNext();
            }

            // check for line with only a label
            if (token instanceof NewLine) {
                // skip to next line and join label(s) to next statement line
                token = getNext();
            }
        }

        if (token instanceof Directive) {
            // directives should parse themselves instead
            statement.directive = token;

            token = getNext();
            while (token instanceof Immediate || token instanceof StrToken || token instanceof Label) {
                if (token instanceof Label) {
                    token = new PlaceholderImmediate(token);
                }
                statement.addParameter(token);
                token = getNext();
                if (token instanceof Comma || token instanceof Colon) {
                    token = getNext();
                }
            }
        } else if (token instanceof Prefix || token instanceof Instruction) {
            // TODO: support multiple Prefixes
            if (token instanceof Prefix) {
                statement.prefix = token;
                token = getNext();
            }

            if (token instanceof Instruction) {
                statement.instruction = token;
                token = getNext();

                while (token instanceof Bracket || token instanceof Register || token instanceof Immediate || token instanceof Label || token instanceof Directive) {
                    if (token instanceof Bracket && token.label === "[") {
                        const memory = new Memory();
                        // handle memory operand
                        token = getNext();

                        while (token instanceof Colon || token instanceof Plus || token instanceof Register || token instanceof Immediate || token instanceof Label) {
                            if (!(token instanceof Colon || token instanceof Plus)) {
                                memory.addToken(token);
                            }
                            token = getNext();
                        }

                        statement.addOperand(memory);
                        if (token instanceof Bracket && token.label === "]") {
                            token = getNext();
                        } else {
                            // Expect a close bracket to end memory operand
                            break;
                        }
                    } else if (token instanceof Label && token.label === "ptr") {
                        const memory = new Memory();
                        //handle memory operand
                        token = getNext();

                        while (token instanceof Colon || token instanceof Plus || token instanceof Register || token instanceof Immediate || token instanceof Label) {
                            if (!(token instanceof Colon || token instanceof Plus)) {
                                memory.addToken(token);
                            }
                            token = getNext();
                        }
                        statement.addOperand(memory);
                    } else {
                        if (token instanceof Directive) {
                            let bits = null;
                            if (token.key === "BYTE") {
                                bits = 8;
                            } else if (token.key === "WORD") {
                                bits = 16;
                            } else {
                                // directive must be a size directive
                                break;
                            }

                            if (!(lookNext() instanceof Immediate || lookNext() instanceof Label)) {
                                // immediate must follow size directive
                                break;
                            }
                            token = getNext();
                            if (token instanceof Label) {
                                token = new PlaceholderImmediate(token);
                            }
                            token.setBits(bits);
                        }
                        if (token instanceof Label) {
                            token = new PlaceholderImmediate(token);
                        }
                        statement.addOperand(token);
                        token = getNext();
                    }
                    if (token instanceof Comma || token instanceof Colon) {
                        token = getNext();
                    }
                }
            }
        }

        while (token !== undefined && !(token instanceof NewLine)) {
            statement.addUnknown(token);
            token = getNext();
        }

        statements.push(statement);

        // read newline
        if (token instanceof NewLine) {
            token = getNext();
        }
    }

    return statements;
}

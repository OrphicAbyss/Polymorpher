"use strict";

import {Label, StrToken, Comma, Colon, NewLine} from "./tokeniser";
import {Directive} from "./directive";
import {Prefix} from "./prefix";
import {Immediate} from "./immediate";
import {Instruction} from "./instruction";
import {Register} from "./register";

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
    const statements = [];

    while (tokens.length > position) {
        let token = tokens[position];

        // parse a statement
        const statement = new Statement();
        //statement -> [labels+] (directive... | [prefix] instruction operand [, operand]) \n
        //directive -> directive parameter [, parameter]
        //parameter -> (immediate | string)
        //operand -> (register | immediate | label)  //todo: handle pointer

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
                statement.addParameter(token);
                token = getNext();
                if (token instanceof Comma || token instanceof Colon) {
                    token = getNext();
                }
            }
        } else if (token instanceof Prefix || token instanceof Instruction) {
            if (token instanceof Prefix) {
                statement.prefix = token;
                token = getNext();
            }

            if (token instanceof Instruction) {
                statement.instruction = token;
                token = getNext();

                while (token instanceof Register || token instanceof Immediate || token instanceof Label) {
                    statement.addOperand(token);
                    token = getNext();
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

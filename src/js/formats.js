"use strict";

import {StrToken} from "./tokeniser";
import {Immediate, PlaceholderImmediate} from "./immediate";
import {DefineDataDirective, ReserveDataDirective} from "./directive";
import {Instruction, RelParam} from "./instruction";

class Format {
    constructor (name, addErrorFn) {
        this.name = name;
        this.addError = addErrorFn;
        this.validDirectives = ["DB", "DW"];
        this.labels = [];
        this.placeholders = [];
        this.binaryOutput = [];
        this.orgOffset = 0;
    }

    addLabel (label) {
        const codeLocation = this.getCurrentCodeLocation();
        const offset = codeLocation + this.orgOffset;
        this.labels.push({label, codeLocation, offset, pos: this.binaryOutput.length});
    }

    addPlaceholder (instruction, operands) {
        const codeLocation = this.getCurrentCodeLocation();
        const offset = codeLocation + this.orgOffset;
        // only add to placeholder list once if multiple operands are labels
        if (this.placeholders.filter((placeholder) => placeholder.position === this.binaryOutput.length).length === 0) {
            this.placeholders.push({
                instruction,
                opcode: null,
                operands,
                position: this.binaryOutput.length,
                offset
            });
        }
    }

    regenPlaceholders () {
        this.placeholders.forEach((placeholder) => {
            // replace binary output of code with fixed offset
            const opcode = placeholder.opcode;

            let fixedOperands = placeholder.operands.map((operand, i) => {
                if (operand instanceof PlaceholderImmediate) {
                    const position = placeholder.position;
                    const label = operand.label;
                    const posLabel = this.labels.filter((labelEntry) => labelEntry.label.label === label.label);
                    switch (posLabel.length) {
                        case 0:
                            console.log(position, `No label definition found during 2 pass processing: ${label.label}`);
                            return operand;
                        case 1:
                            if (opcode && opcode.operands[i] instanceof RelParam) {
                                let pos = placeholder.position;
                                if (posLabel[0].pos > placeholder.position) {
                                    // relative addresses ignore the current instructions code
                                    pos++;
                                }
                                const codeLocation = this.getCodeLocation(pos);
                                operand.value = posLabel[0].offset - codeLocation;
                            } else {
                                operand.value = posLabel[0].offset;
                            }
                            return operand;
                        default:
                            console.log(position, `Multiple label definitions found during 2 pass processing: ${label.label}`);
                            return operand;
                    }
                }
                return operand;
            });

            if (opcode !== null) {
                try {
                    this.binaryOutput[placeholder.position] = opcode.getBytes(fixedOperands);
                } catch (e) {
                    console.log(placeholder.position, `Error regenerating instruction: ${opcode.instruction.key} ${fixedOperands.join(", ")}`);
                }
            } else {
                if (placeholder.instruction.toCode !== undefined) {
                    this.binaryOutput[placeholder.position] = placeholder.instruction.toCode(...fixedOperands);
                } else {
                    console.log(placeholder.position, `Error regenerating instruction: ${placeholder.instruction.key} ${fixedOperands.join(", ")}`);
                }
            }
        });
    }

    getCurrentCodeLocation () {
        return this.binaryOutput.map((bits) => bits.length).reduce((sum, bits) => sum + bits, 0) / 8;
    }

    getCodeLocation (instructionCount) {
        const loc = this.binaryOutput.filter((bits, i) => i < instructionCount)
            .map((bits) => bits.length)
            .reduce((sum, bits) => sum + bits, 0) / 8;

        if (loc.toString().indexOf(".") !== -1) {
            console.log(`Locations should always be 8 bit aligned: ${loc}`);
        }

        return loc;
    }

    isValidDirective(directive) {
        return this.validDirectives.filter((str) => str == directive.key).length === 1;
    }

    handleDirective(directive, parameters) {
        console.log(`Directive handling code for format not overridden by format class (${this.name})`);

    }

    regenerateHeader () {
        // used by advanced formats to recreate header structure after assembling
    }

    toCode () {
        console.log(`Code generation for format not overridden by format class (${this.name})`);
        return "";
    }
}

export class FormatCOM extends Format {
    constructor (addErrorFn) {
        super("COM", addErrorFn);
        this.validDirectives.push("ORG");
    }

    handleDirective (directive, parameters) {
        switch (directive.key) {
            case "ORG":
                // handle org
                this.orgOffset = parameters[0].value;
                break;
            default:
                if (directive instanceof DefineDataDirective || directive instanceof ReserveDataDirective) {
                    this.binaryOutput.push(directive.toCode(...parameters));
                } else {
                    console.log(`Unknown directive, shouldn't be considered valid: ${directive.key}`);
                }
                break;
        }
    }

    toCode () {
        return "";
    }
}

export class SegmentReference {
    constructor (segment, position, byte) {
        this.segment = segment;
        this.position = position;
        this.byte = byte;
    }
}

export class FormatMZ extends Format {
    constructor (addErrorFn) {
        super("MZ", addErrorFn);
        this.validDirectives.push("ENTRY", "STACK", "SEGMENT", "INCLUDE");

        this.segments = [];
        this.segmentReferences = [];
        this.entrySegment = null;
        this.entryLabel = null;
        this.stackStart = 0;
        this.heapSize = null;
        this.headerSize = 0;

        // add our header as a placeholder
        this.binaryOutput.push(this.toCode());
    }

    getCurrentCodeLocation (position) {
        if (position) {
            return this.binaryOutput.slice(0,position).map((bits) => bits.length).reduce((sum, bits) => sum + bits, 0) / 8;
        }
        return super.getCurrentCodeLocation();
    }

    handleDirective (directive, parameters) {
        switch (directive.key) {
            case "SEGMENT":
                this.addSegment(directive, parameters[0]);
                break;
            case "ENTRY":
                this.setEntry(parameters[0], parameters[1]);
                break;
            case "HEAP":
                const heapSize = parameters[0];
                if (heapSize instanceof Immediate) {
                    this.setHeap(parameters[0]);
                } else {
                    console.log(`Heap directive takes an Immediate or Constant value as a parameter, instead got ${parameters[0]}`);
                }
                break;
            case "STACK":
                const stackSize = parameters[0];
                if (stackSize instanceof Immediate) {
                    this.setStack(parameters[0]);
                } else {
                    console.log(`Stack directive takes an Immediate or Constant value as a parameter, instead got ${parameters[0]}`);
                }
                break;
            default:
                if (directive instanceof DefineDataDirective || directive instanceof ReserveDataDirective) {
                    this.binaryOutput.push(directive.toCode(...parameters));
                } else {
                    console.log(`Unknown directive, shouldn't be considered valid: ${directive.key}`);
                }
                break;
        }
    }

    addLabel (label) {
        const codeLocation = this.getCurrentCodeLocation();
        const segment = this.segments[this.segments.length - 1];
        const offset = codeLocation - segment.startLocation;
        this.labels.push({label, codeLocation, segment, offset});
    }

    addPlaceholder (instruction, operands) {
        const segment = this.segments[this.segments.length - 1];
        // only add to placeholder list once if multiple operands are labels
        if (this.placeholders.filter((placeholder) => placeholder.position === this.binaryOutput.length).length === 0) {
            this.placeholders.push({
                segment,
                instruction,
                opcode: null,
                operands,
                position: this.binaryOutput.length
            });
        }
    }

    regenPlaceholders () {
        this.placeholders.forEach((placeholder) => {
            const fixedOperands = placeholder.operands.map((operand) => {
                if (operand instanceof PlaceholderImmediate) {
                    const position = placeholder.position;
                    const label = operand.label;
                    const posLabel = this.labels.filter((labelEntry) => labelEntry.label.label === label.label);
                    const posSegment = this.segments.filter((segmentEntry) => segmentEntry.segment.label === label.label);
                    switch (posLabel.length + posSegment.length) {
                        case 0:
                            console.log(position, `No label definition found during 2 pass processing: ${label.label}`);
                            return operand;
                        case 1:
                            if (posLabel.length) {
                                return new Immediate(posLabel[0].offset);
                            } else {
                                // estimate that most segment immediates will be provided as the last word of the instruction
                                const bytePos = this.binaryOutput[placeholder.position].length / 8 - 2;
                                this.addSegmentReference(placeholder.segment, position, bytePos);
                                return new Immediate(posSegment[0].offset / 16);
                            }

                        default:
                            console.log(position, `Multiple label definitions found during 2 pass processing: ${label.label}`);
                            return operand;
                    }
                }
                return operand;
            });
            // replace binary output of code with fixed offset
            const opcode = placeholder.opcode;
            if (opcode !== null) {
                this.binaryOutput[placeholder.position] = opcode.getBytes(fixedOperands);
            }
        });
    }

    addSegment(directive, segment) {
        const position = this.binaryOutput.length;
        const codeLocation = this.getCurrentCodeLocation();
        // pad code
        this.binaryOutput.push(directive.toCode(codeLocation));
        // add segment lookup
        const startLocation = this.getCurrentCodeLocation();
        const offset = startLocation - this.headerSize * 16;
        this.segments.push({position, directive, segment, codeLocation: startLocation, startLocation, offset});
    }

    addSegmentReference(segment, position, byte) {
        let codeLocation = this.getCurrentCodeLocation(position) - this.headerSize * 16;
        this.segmentReferences.push(new SegmentReference(segment, codeLocation, byte));
    }

    regenSegment(segmentObj) {
        const position = segmentObj.position;
        const currentCodeLocation = this.getCurrentCodeLocation(position);
        this.binaryOutput[position] = segmentObj.directive.toCode(currentCodeLocation);
        segmentObj.codeLocation = this.getCurrentCodeLocation(position + 1);
        segmentObj.offset = segmentObj.codeLocation - this.headerSize * 16;
    }

    setEntry(segment, label) {
        this.entrySegment = segment;
        this.entryLabel = label;
    }

    setHeap(immediate) {
        this.heapSize = immediate.value;
    }

    setStack(immediate) {
        this.stackStart = immediate.value;
    }

    regenerateHeader () {
        this.binaryOutput[0] = this.toCode();
    }

    toCode () {
        // From https://www.fileformat.info/format/exe/corion-mz.htm
        const dataNames = [
            "id",
            "bytesInLastPage",
            "pagesInExecutable",
            "numRelocationEntries",
            "headerSize",
            "minParagraphAllocated",
            "maxParagraphAllocated",
            "initialSSOffset",
            "initialSPOffset",
            "checksum",
            "initialCSOffset",
            "initialIPOffset",
            "reallocTableOffset",
            "overlayNumber"
        ];

        this.segments.forEach((segment) => this.regenSegment(segment));

        const codeSize = this.getCurrentCodeLocation();
        const pageCount = Math.ceil(codeSize / 256);
        const lastPageSize = codeSize % 256;
        const relocationEntries = this.segmentReferences.length;
        this.headerSize = Math.ceil(((this.binaryOutput[0] || {length: dataNames.length * 2 * 8}).length / 8 + relocationEntries * 4) / 16);
        const minPara = Math.max(Math.ceil(codeSize / 16), Math.ceil(this.stackStart / 16));// - headerSize;
        const maxPara = this.heapSize !== null ? minPara + this.heapSize : 65535;
        const stackSize = 4; // 4096; - not sure why 4
        const stackPointer = this.stackStart;
        const checksum = 0; // should make adding all the words in the file 0 if done correctly
        const entrySegObj = this.segments.find((segment) => segment.segment.label === this.entrySegment.label);
        const entrySegment = (entrySegObj && entrySegObj.offset || 0) / 16;
        const entryLabObj = this.labels.find((label) => label.label.label === this.entryLabel.label);
        const entryLabel = entryLabObj && entryLabObj.offset || 0;
        const relocationEntryOffest = 28;
        const overlayNumber = 0; // 0 is the id for main program

        const data = [
            new StrToken("MZ"),                  // 0 - 01001101 01011010
            new Immediate(lastPageSize),                // 2 - 01100101 00000000
            new Immediate(pageCount),                   // 4 - 00000001 00000000
            new Immediate(relocationEntries),           // 6 - 00000010 00000000
            new Immediate(this.headerSize),             // 8 - 00000011 00000000
            new Immediate(minPara),                     // A - 00010000 00000000
            new Immediate(maxPara),                     // C - 11111111 11111111
            new Immediate(stackSize),                   // E - 00000100 00000000
            new Immediate(stackPointer),                //10 - 00000000 00000001
            new Immediate(checksum),                    //12 -
            new Immediate(entryLabel),                  //14 -
            new Immediate(entrySegment),                //16 -
            new Immediate(relocationEntryOffest),       //18 -
            new Immediate(overlayNumber)                //1A -
        ];

        this.segmentReferences.map((segmentRef, i) => {
            const segment = segmentRef.segment.offset / 16;
            const position = segmentRef.position;
            const byte = segmentRef.byte;
            data.push(new Immediate(position + byte));
            data.push(new Immediate(segment));
        });

        return data.map((item) => item instanceof StrToken ? item.toCode() : item.getBytes(16))
            .join("");
    }
}
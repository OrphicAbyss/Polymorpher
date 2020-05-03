"use strict";

import {schemeTableau10} from "d3-scale-chromatic";
import React from "react";
import {Box, DataTable, Text} from "grommet";
import {instructions} from "../instruction";

export function InstructionTable (props) {
    return (
        <DataTable
            columns={[
                {
                    property: "key",
                    header: <Text>Instruction</Text>,
                    primary: true
                },
                {
                    property: "name",
                    header: <Text>Description</Text>
                },
                {
                    property: "instruction",
                    header: <Text>Instruction Format</Text>,
                    render: datum => (datum.opcodes || [])
                        .map((op, i) => <Box key={i}><Text>{datum.key} <i>{op.toInstructionString()}</i></Text></Box>)
                },
                {
                    property: "opcodes",
                    header: <Text>Op Code Hex Format</Text>,
                    render: datum => (datum.opcodes || [])
                        .map((op, i) => <Box key={i}><Text>{op.toOpCodeString()}</Text></Box>)
                }
            ]}
            data={instructions}
        />
    );
}

const allOpCodes = {};
const groups = [];
instructions.forEach((ins) => ins.group && !groups.includes(ins.group) && groups.push(ins.group));
[].concat.apply([], instructions.map(ins => ins.opcodes)).forEach(op => {
    const alreadySet = allOpCodes[op.code];
    if (alreadySet) {
        alreadySet.push(op);
    } else {
        allOpCodes[op.code] = [op];
    }
});

const groupKeys = [];
const subGroupKeys = [];
const groupOpCodes = {};
Object.keys(allOpCodes).forEach(key => {
    const opCodeArray = allOpCodes[key];
    if (opCodeArray.length > 1 && opCodeArray.every(op => !!op.subCode)) {
        const opCode = opCodeArray[0];
        groupKeys.push(opCode.code);
        groupOpCodes[opCode.code] = {};
        opCodeArray.forEach((op) => {
            if (!subGroupKeys.includes(op.subCode)) {
                subGroupKeys.push(op.subCode);
            }
            if (groupOpCodes[op.code][op.subCode]) {
                groupOpCodes[op.code][op.subCode].push(op);
            } else {
                groupOpCodes[op.code][op.subCode] = [op];
            }
        });
    }
});
groupKeys.sort();
subGroupKeys.sort();

function OpCodeCell (props) {
    const code = props.code;
    const opCodeArray = allOpCodes[code];
    if (opCodeArray) {
        const opCode = opCodeArray[0];
        const instruction = opCode.instruction;
        const colorIndex = instruction.group ? groups.indexOf(instruction.group) : -1;
        const color = colorIndex !== -1 ? schemeTableau10[colorIndex] : undefined;

        let group = false;
        // test for group, will have multiple instructions and subCodes
        if (opCodeArray.length > 1 && opCodeArray.every(op => !!op.subCode)) {
            group = true;
        }

        if (!group) {
            if (opCodeArray.every(op => op.operands.every((operand, i) => operand.equals(opCode.operands[i])))) {
                return (<Box pad="xsmall" align="center" background={{color: color}}>
                    <Text size="xsmall">{opCodeArray.map(op => op.instruction.key).join("/")}{"\u00A0"}{opCode.toInstructionString()}</Text>
                </Box>);
            } else {
                return (<Box pad="xsmall" align="center" background={{color: color}}>
                    {opCodeArray.map((op, i) => <Text key={i} size="xsmall">{op.instruction.key}{'\u00A0'}{op.toInstructionString()}</Text>)}
                </Box>);
            }
        } else {
            return <Box pad="xsmall" align="center" background={{color: color}}><Text size="xsmall">{'\u00A0'}</Text></Box>;
        }
    } else {
        return <Box pad="xsmall" align="center"></Box>;
    }
}

function OpCodeWithSubCell (props) {
    const code = props.code;
    const subCode = props.subCode;

    const opCodeArray = allOpCodes[code];
    if (opCodeArray) {
        const subCodeArray = opCodeArray.filter(op => op.subCode === subCode);
        if (subCodeArray.length > 0) {
            const opCode = subCodeArray[0];
            const instruction = opCode.instruction;
            const colorIndex = instruction.group ? groups.indexOf(instruction.group) : -1;
            const color = colorIndex !== -1 ? schemeTableau10[colorIndex] : undefined;

            return (<Box pad="xsmall" align="center" background={{color: color}}>
                {subCodeArray.map((op, i) => <Text size="xsmall" key={i}>{op.instruction.key}{'\u00A0'}{op.toInstructionString()}</Text>)}
            </Box>);
        }
    }
    return <Box pad="xsmall" align="center"></Box>;
}

function TabBox (props) {
    return (<Box pad="xsmall" align="center"><Text size="xsmall">{props.children}</Text></Box>)
}

export function InstructionGrid (props) {
    const codes = ["", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];

    return (<table>
        <tbody>
        {codes.map((v1, i) => (<tr key={i}>
            {(i === 0) && codes.map((v2, j) => (j === 0) ? <td key={"x" + j}>{}</td> :
                <td key={j}><TabBox>x{v2}</TabBox></td>)}
            {(i !== 0) && codes.map((v2, j) => (j === 0) ? <td key={j}><TabBox>{v1}x</TabBox></td> :
                <td key={j}><OpCodeCell code={v1 + v2}/></td>)}
        </tr>))}
        </tbody>
    </table>);
}

export function InstructionSubGrid (props) {
    return (<table>
        <tbody>
        <tr><td>{'\u00A0'}</td>{subGroupKeys.map((subCode, i) => <td key={i}><TabBox>{subCode}</TabBox></td>)}</tr>
        {groupKeys.map((code, i) => <tr key={i}>
            <td><TabBox>{code}</TabBox></td>
            {subGroupKeys.map((subCode, j) => <td key={`s${j}`}><OpCodeWithSubCell code={code} subCode={subCode}/></td>)}
        </tr>)}
        </tbody>
    </table>)
}
"use strict";

import React, {Fragment} from "react";
import {Text} from "grommet/components/Text";
import {Anchor} from "grommet/components/Anchor";
import {Box} from "grommet/components/Box";
import {TextArea} from "grommet";
import {Test} from "../8086-emu/8086.asm";

export function EMU8086 (props) {
    const [cpu, setCPU] = React.useState(null);
    const [registers, setRegisters] = React.useState(null);

    const [emuOutput, setEMUOutput] = React.useState("");

    const bios = props.bios;

    function exec() {
        const output = [];
        try {
            output.push("Running...");
            const structures = Test(bios);
            output.push("Done");
            structures.logs.forEach((item) => output.push(item));
            structures.errors.forEach((item) => output.push(item));
            //output.push(structures.registers.getInstructionLocation().toString(16));

            setRegisters(structures.registers);

            setEMUOutput(output.join("\n"));
        } catch (e) {
            setEMUOutput(e.toString());
        }
    }

    return (
        <Fragment>
            <Anchor label="Run..." onClick={() => exec()}/>
            <Box height="large">
                <TextArea value={emuOutput} fill></TextArea>
            </Box>
            {registers && (
                <Box direction="row">
                    <Box background="brand" round="xsmall" pad="xsmall" fill>IP</Box>
                    <Box background="dark-1" round="xsmall" pad="xsmall" fill>{registers.getInstructionPointer().toString(16)}h</Box>
                    {Object.keys(registers.seg16)
                        .filter((reg) => typeof(registers.seg16[reg]) !== "function")
                        .map((reg) => (
                            <Fragment>
                                <Box key={reg + "-name"} background="brand" round="xsmall" pad="xsmall" fill>{reg}</Box>
                                <Box key={reg + "-value"} background="dark-1" round="xsmall" pad="xsmall" fill>{registers.getSegment16Bit(reg).toString(16)}h</Box>
                            </Fragment>
                        ))
                    }
                </Box>
            )}

            <Box direction="row">
                {registers && Object.keys(registers.reg16)
                    .filter((reg) => typeof(registers.reg16[reg]) !== "function")
                    .map((reg) => (
                        <Fragment>
                            <Box key={reg + "-name"} background="brand" round="xsmall" pad="xsmall" fill>{reg}</Box>
                            <Box key={reg + "-value"} background="dark-1" round="xsmall" pad="xsmall" fill>{registers.getGeneral16Bit(reg).toString(16)}h</Box>
                        </Fragment>
                    ))
                }
            </Box>
            <Box direction="row">
                {registers && Object.keys(registers.reg8)
                    .filter((reg) => typeof(registers.reg8[reg]) !== "function")
                    .map((reg) => (
                        <Fragment>
                            <Box key={reg + "-name"} background="brand" round="xsmall" pad="xsmall" fill>{reg}</Box>
                            <Box key={reg + "-value"} background="dark-1" round="xsmall" pad="xsmall" fill>{registers.getGeneral8Bit(reg).toString(16)}h</Box>
                        </Fragment>
                    ))
                }
            </Box>
        </Fragment>
    );
}
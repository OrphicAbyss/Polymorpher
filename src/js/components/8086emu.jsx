"use strict";

import React, {Fragment} from "react";

import {Anchor} from "grommet/components/Anchor";
import {Box} from "grommet/components/Box";
import {Button} from "grommet/components/Button";
import {Table} from "grommet/components/Table";
import {TableBody} from "grommet/components/TableBody";
import {TableHeader} from "grommet/components/TableHeader";
import {TableRow} from "grommet/components/TableRow";
import {TableCell} from "grommet/components/TableCell";
import {Text} from "grommet/components/Text";
import {TextArea} from "grommet/components/TextArea";

import {Connectivity} from "grommet-icons/icons/Connectivity";
import {FormNext} from "grommet-icons/icons/FormNext";
import {Play} from "grommet-icons/icons/Play";
import {Pause} from "grommet-icons/icons/Pause";


import {Test} from "../8086-emu/8086.asm";


export function EMU8086 (props) {
    const textAreaRef = React.useRef(undefined);

    const [step, setStep] = React.useState(null);
    const [cpu, setCPU] = React.useState(null);
    const [registers, setRegisters] = React.useState(null);
    const [memory, setMemory] = React.useState(null);
    const [logs, setLogs] = React.useState(null);
    const [errors, setErrors] = React.useState(null);

    const [cpuTimer, setCpuTimer] = React.useState(null);

    const [registerTable, setRegTable] = React.useState([]);
    const [memoryTable, setMemTable] = React.useState([]);
    const [flagTable, setFlagTable] = React.useState([]);

    const [emuOutput, setEMUOutput] = React.useState([]);

    const bios = props.bios;

    const toHex = (val) => {
        let out = (val | 0).toString(16).toUpperCase();

        while ((out.length & (out.length - 1)) !== 0 || out.length < 2) {
            out = "0" + out;
        }

        return out;
    }

    React.useEffect(() => {
        if (registers) {
            const regTab = [];

            regTab.push(["Address", registers.getInstructionLocation()]);
            regTab.push(["IP", registers.getInstructionPointer()]);

            Object.keys(registers.seg16)
                .sort()
                .filter((reg) => typeof(registers.seg16[reg]) !== "function" && reg.indexOf("X") === -1)
                .forEach((reg) => {
                    regTab.push([reg, registers.getSegment16Bit(registers.seg16[reg])]);
                });

            Object.keys(registers.reg16)
                .sort()
                .filter((reg) => typeof(registers.reg16[reg]) !== "function" && reg.indexOf("X") === -1)
                .forEach((reg) => {
                    regTab.push([reg, registers.getGeneral16Bit(registers.reg16[reg])]);
                });

            Object.keys(registers.reg16)
                .sort()
                .filter((reg) => typeof(registers.reg16[reg]) !== "function" && reg.indexOf("X") !== -1)
                .forEach((reg) => {
                    regTab.push([reg, registers.getGeneral16Bit(registers.reg16[reg])]);
                });

            regTab.forEach((row) => row[1] = toHex(row[1]));

            setRegTable(regTab);

            const flagTab = [];

            const flags = registers.flags;
            const flagVal = registers.getFlags();

            Object.keys(flags)
                .filter((flag) => flag !== "All")
                .forEach((flag) => {
                    flagTab.push([flag, (!!(flagVal & flags[flag])).toString()]);
                })

            setFlagTable(flagTab);
        }
    }, [registers, step]);

    React.useEffect(() => {
        if (memory && registers) {
            const location = registers.getInstructionLocation();
            const memTab = [];

            for (let i=-4; i<10; i++) {
                const loc = location + i;
                const val = memory.getByte(loc);

                memTab.push([toHex(loc), toHex(val)]);
            }

            setMemTable(memTab);
        }
    }, [registers, memory, step]);

    function reset () {
        try {
            pauseCPU();
            setStep(0);

            const structures = Test(bios);
            setLogs(structures.logs);
            setErrors(structures.errors);

            setCPU(structures.cpu);
            setRegisters(structures.registers);
            setMemory(structures.memory);

            setEMUOutput(["VM Started"]);
        } catch (e) {
            setEMUOutput([e.toString()]);
        }
    }

    function stepCPU () {
        if (cpu) {
            pauseCPU();

            try {
                setStep((prev) => prev + 1);
                cpu.execute();

                const output = [];
                logs.forEach((item) => output.push(item));
                errors.forEach((item) => output.push(item));
                setEMUOutput(output);
            } catch (e) {
                const output = [];
                output. push(e.toString());
                setEMUOutput(output);
            }
        }
    }

    function runCPU () {
        if (cpu) {
            pauseCPU();

            stepCPU();
            const timer = setInterval(() => {
                stepCPU();
            }, 1000);

            setCpuTimer(timer);
        }
    }

    function pauseCPU () {
        if (cpuTimer) {
            setCpuTimer((prev) => {
                clearInterval(prev);
                return null;
            });
        }
    }

    // Ensure we stop the cpu when we leave the page
    React.useEffect(() => {
        return () => {
            pauseCPU();
        }
    }, []);

    React.useEffect(() => {
        if (textAreaRef && textAreaRef.current) {
            const textarea = textAreaRef.current;

            textarea.scrollTop = textarea.scrollHeight;
        }
    }, [emuOutput]);

    return (
        <Fragment>
            <Box direction="row">
                {!cpu && <Button label="Start" onClick={() => reset()}/>}
                {cpu && <Button label="Reset" onClick={() => reset()}/>}
                {cpu && <Button label="Step" onClick={() => stepCPU()}/>}
                {cpu && !cpuTimer && <Button label="Run" onClick={() => runCPU()}/>}
                {cpu && cpuTimer && <Button label="Pause" onClick={() => pauseCPU()}/>}
                {/*<Text>CPU Step: {step}</Text>*/}
            </Box>
            <Box direction="row" height="large">
                <TextArea ref={textAreaRef} value={emuOutput.join("\n")} fill></TextArea>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableCell>Location</TableCell>
                            <TableCell>Value</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {memoryTable.map((row, i) => {
                            return <TableRow key={i}>
                                <TableCell>{row[0]}</TableCell>
                                <TableCell>{row[1]}</TableCell>
                            </TableRow>;
                        })}
                    </TableBody>
                </Table>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableCell>Reg</TableCell>
                            <TableCell>Value</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {registerTable.map((row, i) => {
                            return <TableRow key={i}>
                                <TableCell>{row[0]}</TableCell>
                                <TableCell>{row[1]}</TableCell>
                            </TableRow>;
                        })}
                    </TableBody>
                </Table>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableCell>Flag</TableCell>
                            <TableCell>Value</TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flagTable.map((row, i) => {
                            return <TableRow key={i}>
                                <TableCell>{row[0]}</TableCell>
                                <TableCell>{row[1]}</TableCell>
                            </TableRow>;
                        })}
                    </TableBody>
                </Table>
            </Box>
        </Fragment>
    );
}
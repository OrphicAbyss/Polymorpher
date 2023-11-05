"use strict";

import React, {Fragment} from "react";

import {Test} from "../8086-emu/8086.asm";


export function EMU8086 (props) {
    const textAreaRef = React.useRef(undefined);

    const [step, setStep] = React.useState(null);
    const [cpu, setCPU] = React.useState(null);
    const [registers, setRegisters] = React.useState(null);
    const [memory, setMemory] = React.useState(null);
    const [bus, setBus] = React.useState(null);
    const [logs, setLogs] = React.useState(null);
    const [errors, setErrors] = React.useState(null);

    const [cpuTimer, setCpuTimer] = React.useState(null);

    const [registerTable, setRegTable] = React.useState([]);
    const [memoryTable, setMemTable] = React.useState([]);
    const [busTable, setBusTable] = React.useState([]);
    const [flagTable, setFlagTable] = React.useState([]);

    const [emuOutput, setEMUOutput] = React.useState([]);

    const bios = props.bios;

    const toHex = (val, len) => {
        len = len || 2;
        let out = (val | 0).toString(16).toUpperCase();

        while ((out.length & (out.length - 1)) !== 0 || out.length < len) {
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

            regTab.forEach((row) => row[1] = toHex(row[1], 4));

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
        if (bus) {

        }
    }, [bus, step]);

    React.useEffect(() => {
        if (memory && registers) {
            const location = registers.getInstructionLocation();
            const memTab = [];

            for (let i=-4; i<10; i++) {
                const loc = location + i;
                const val = memory.getByte(loc);

                memTab.push([toHex(loc), toHex(val), i===0]);
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
            setBus(structures.bus);

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

    function runCPU (mul) {
        mul = mul || 1;

        if (cpu) {
            pauseCPU();

            stepCPU();
            const timer = setInterval(() => {
                stepCPU();
            }, 1000 / mul);

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
            <div className="fillScroll flexCol">
            <div className="flexRow">
                {!cpu && <button onClick={() => reset()}>Start</button>}
                {cpu && <Fragment>
                    <button onClick={() => reset()}>Reset</button>
                    <button onClick={() => stepCPU()}>Step</button>
                    {!cpuTimer && <Fragment>
                        <button onClick={() => runCPU()}>Run</button>
                        <button onClick={() => runCPU(2)}>Run x2</button>
                        <button onClick={() => runCPU(4)}>Run x4</button>
                    </Fragment>}
                    {cpuTimer && <button onClick={() => pauseCPU()}>Pause</button>}
                </Fragment>}
                {/*<Text>CPU Step: {step}</Text>*/}
            </div>
            <div className="flexFill flexRow">
                <div className="flexFill flexCol">
                    <h3>History</h3>
                    <textarea className="flexFill" ref={textAreaRef} value={emuOutput.join("\n")} readOnly={true}></textarea>
                </div>
                <div className="flexRow">
                    <div>
                        <h3>Memory</h3>
                        <table>
                            <thead>
                            <tr>
                                <th>Location</th>
                                <th>Value</th>
                            </tr>
                            </thead>
                            <tbody>
                            {memoryTable.map((row, i) => {
                                return <tr key={i}>
                                    <td>{!row[2] ? row[0] : <b>{row[0]}</b>}</td>
                                    <td>{!row[2] ? row[1] : <b>{row[1]}</b>}</td>
                                </tr>;
                            })}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h3>Registers</h3>
                        <table>
                            <thead>
                            <tr>
                                <th>Reg</th>
                                <th>Value</th>
                            </tr>
                            </thead>
                            <tbody>
                            {registerTable.map((row, i) => {
                                return <tr key={i}>
                                    <td>{row[0]}</td>
                                    <td>{row[1]}</td>
                                </tr>;
                            })}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h3>Flags</h3>
                        <table>
                            <thead>
                            <tr>
                                <th>Flag</th>
                                <th>Value</th>
                            </tr>
                            </thead>
                            <tbody>
                            {flagTable.map((row, i) => {
                                return <tr key={i}>
                                    <td>{row[0]}</td>
                                    <td>{row[1]}</td>
                                </tr>;
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            </div>
        </Fragment>
    );
}

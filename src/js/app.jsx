"use strict";

import React from "react";
import {Grommet} from "grommet/components/Grommet";
import {Anchor} from "grommet/components/Anchor";
import {Box} from "grommet/components/Box";
import {Button} from "grommet/components/Button";
import {Footer} from "grommet/components/Footer";
import {Grid} from "grommet/components/Grid";
import {Header} from "grommet/components/Header";
import {Heading} from "grommet/components/Heading";
import {Layer} from "grommet/components/Layer";
import {Nav} from "grommet/components/Nav";
import {Tabs} from "grommet/components/Tabs";
import {Tab} from "grommet/components/Tab";
import {Text} from "grommet/components/Text";
import {Code} from "grommet-icons/icons/Code";
import {Cube} from "grommet-icons/icons/Cube";
import {FormClose} from "grommet-icons/icons/FormClose";
import {List as ListIcon} from "grommet-icons/icons/List";
import {Table} from "grommet-icons/icons/Table";
// import {V86Terminal} from "./v86";
import {schemeCategory10} from "d3-scale-chromatic";

import {scanCode} from "./scanner";
import {tokenise} from "./tokeniser";
import {parse} from "./parser";
import {assemble} from "./assemble";
import {FS} from "./file_store";

import {
    InstructionGrid,
    InstructionSubGrid,
    InstructionTable
} from "./components/instruction_table";
import {Editor} from "./components/editor";
import {Files} from "./components/files";

const colourCodes = {};

export function getColor (type) {
    let code = colourCodes[type];
    if (code === undefined) {
        code = Object.keys(colourCodes).length % 10;
        colourCodes[type] = code;
    }
    return schemeCategory10[code];
}

export default function App () {
    const [aboutLayer, showAboutLayer] = React.useState(false);
    const [insLayer, showInsLayer] = React.useState(false);
    const [opcodeLayer, showOpcodeLayer] = React.useState(false);

    const [fs] = React.useState(FS());
    const [file, setFile] = React.useState(null);
    const [code, setCode] = React.useState("");
    const [changed, setChanged] = React.useState(false);
    const codeUpdate = (text) => {
        setCode(text);
        setChanged(true);
        fs.setFile(file, text)
            .then(() => setChanged(false));
    };
    const loadFile = (filename, text) => {
        // load new file
        setFile(filename);
        setCode(text);
    }

    const timeStart = new Date();

    const lexemes = scanCode(code);
    console.log(lexemes);
    const timeScanning = new Date();

    const tokens = tokenise(lexemes);
    console.log(tokens);
    const timeTokenise = new Date();

    const parsed = parse(tokens);
    console.log(parsed);
    const timeParsed = new Date();

    const assembled = assemble(parsed);
    console.log(assembled);
    const timeAssembled = new Date();

    const binary = assembled.binaryOutput.join("");
    const buffer = [];
    for (let i = 0; i < binary.length; i += 8) {
        buffer.push(parseInt(binary.substr(i, 8), 2));
    }
    const blob = new Blob([new Uint8Array(buffer)], {type: "application/binary"});
    const url = URL.createObjectURL(blob);

    return (
        <Grommet full>
            {insLayer && (
                <Layer
                    position="right"
                    full="vertical"
                    modal
                    onEsc={() => showInsLayer(false)}
                    onClickOutside={() => showInsLayer(false)}
                >
                    <Button label="close" icon={<FormClose/>} onClick={() => showInsLayer(false)}/>
                    <Heading>8086 Instruction List</Heading>
                    <Box overflow="auto">
                        <InstructionTable/>
                    </Box>
                </Layer>
            )}

            {opcodeLayer && (
                <Layer
                    position="right"
                    full="vertical"
                    modal
                    onEsc={() => showOpcodeLayer(false)}
                    onClickOutside={() => showOpcodeLayer(false)}
                >
                    <Button label="close" icon={<FormClose/>} onClick={() => showOpcodeLayer(false)}/>
                    <Box overflow="auto">
                        <Box><Heading>8086 Op Code Table</Heading></Box>
                        <Box overflow="scroll"><InstructionGrid/></Box>
                        <Box><Heading>Sub Op Code Table</Heading></Box>
                        <Box><InstructionSubGrid/></Box>
                    </Box>
                </Layer>
            )}

            {aboutLayer && (
                <Layer
                    modal
                    onEsc={() => showAboutLayer(false)}
                    onClickOutside={() => showAboutLayer(false)}
                >
                    <Header background="dark-2" pad="small" gap="medium">
                        <Box direction="row" align="center" gap="small">
                            <Cube/>
                            <Heading size="small">
                                WebAssembler
                            </Heading>
                            <Text>An online x86 assembler</Text>
                        </Box>
                        <Nav direction="row">
                            <Button label="close" icon={<FormClose/>} onClick={() => showAboutLayer(false)}/>
                        </Nav>
                    </Header>
                    <Box overflow="auto" pad="small">
                        <Text>
                            An 8086 assembler written in Javascript which lets you download the binary output of the
                            assembled code. It assembles code written in
                            <Anchor label="Intel syntax" href="https://en.wikipedia.org/wiki/X86_assembly_language#Syntax"/> as
                            this was the syntax style I had used previously on the few occasions in which I wrote
                            assembly code previously. It also tries to match the acceptable input as defined by
                            <Anchor label="flat assembler" href="https://flatassembler.net/docs.php?article=manual"/> and
                            code is tested against the output of <i>fasm</i>. More advanced features are not
                            supported.
                        </Text>
                        <Heading level="4">How did we get here</Heading>
                        <Text>
                            Some time back I was writing some toy compilers/interpreters and after some work in this
                            area became interested in writing a compiler written in Javascript. After embarking on this
                            project, I thought it would be nice to generate the binary output direct from the website.

                            This lead to the idea of writing a assembler, as it's the simplest form of language when
                            generating machine code from it. However in a simple toy language it is unlikely that you
                            would use all the instructions possible. In this way the language drives the required
                            instructions needed. When writing an assembler there is no external drive on what
                            instructions should be possible. So in hindsight, writing an assembler was most likely a
                            more involved project.
                        </Text>
                        <Heading level="4">Output formats</Heading>
                        <Text>
                            Currently this assembler supports two output formats Binary output and MZ Executable.
                            Binary output was historically used early in computing. For example DOS .com files use this
                            format. There is no metadata generated, the instructions are directly output to the binary
                            file. For MZ EXE files some simple metadata is included at the start of the file which
                            record references to the different segments in the file so that a exe loader can replace the
                            references with correct memory locations based on where the executable was loaded into
                            memory.
                        </Text>
                        <Heading level="4">Current focus</Heading>
                        <Text>
                            The next area being developed is an 8086 emulator in which to run and test code written on
                            this site. This will include writing a BIOS for the emulator to allow a operating system
                            to be run. This work will drive the features created.
                        </Text>
                        <Heading level="4">Contact</Heading>
                        <Text>
                            If you find bugs (there are most likely some in binary generation still) or with the general
                            interface you can <Anchor label="contact me here" href="mailto:webasm@jorts.solutions"/>.
                        </Text>
                    </Box>
                </Layer>
            )}

            <Grid
                rows={["auto", "flex"]}
                columns={["auto", "flex"]}
                fill
                areas={[
                    ["header", "header"],
                    ["sidebar", "main"],
                    ["footer", "footer"]
                ]}
            >
                <Box gridArea="header">
                    <Header background="dark-1" gap="medium">
                        <Box direction="row" align="center" gap="small">
                            <Cube/>
                            <Heading color="white" size="small">
                                WebAssembler
                            </Heading>
                            <Text>An online x86 assembler</Text>
                        </Box>
                        <Nav direction="row">
                            <Anchor label="About" icon={<Code/>} onClick={() => showAboutLayer(true)}/>
                            <Anchor label="Instructions" icon={<ListIcon/>} onClick={() => showInsLayer(true)}/>
                            <Anchor label="Op Codes" icon={<Table/>} onClick={() => showOpcodeLayer(true)}/>
                        </Nav>
                    </Header>
                </Box>
                <Box gridArea="sidebar" background="light-1">
                    <Files fs={fs} loadFile={loadFile} openFile={file} fileChanged={changed}/>
                </Box>
                <Box gridArea="main" overflow="auto" direction="column">
                    <Tabs flex>
                        <Tab title="Code">
                            <Box pad="small" fill>
                                <Editor value={code} onChange={codeUpdate}/>
                            </Box>
                        </Tab>
                        {/*<Tab title="Lexemes">*/}
                        {/*    <Box pad="medium">*/}
                        {/*        {lexemes.map((token, i) => (<div key={i} style={{color: schemeCategory10[token.type]}}>{token.token}</div>))}*/}
                        {/*    </Box>*/}
                        {/*</Tab>*/}
                        <Tab title="Tokens">
                            <Box pad="medium">
                                {tokens.map((token, i) => (
                                    <div key={i} style={{color: getColor(token.type)}}>{i}: {token.toString() + " " + token.type}</div>
                                ))}
                            </Box>
                        </Tab>
                        <Tab title="Parsed">
                            <Box pad="medium">
                                {parsed.map((statement, i) => (
                                    <div key={i} style={{color: getColor(statement.getType())}}>{i}: {statement.toString() + " " + statement.getType()}</div>
                                ))}
                            </Box>
                        </Tab>
                        <Tab title="Binary">
                            <Box pad="medium">
                                {assembled.errors.map((error, i) => (<div key={"e" + i} style={{color: "red"}}>{error}</div>))}
                                {assembled.binaryOutput.map((binary, i) => (<div key={"b" + i}>{i}: {binary}</div>))}
                                <Button href={url} label="Download Machine Code" download="code.com"/>
                            </Box>
                        </Tab>
                        <Tab title="Formatted Binary">
                            <Box pad="medium">
                                {assembled.errors.map((error, i) => (<div key={"e" + i} style={{color: "red"}}>{error}</div>))}
                                {assembled.formattedBin.map((line, i) => (<div key={"l" + i}>{line}</div>))}
                                <Button href={url} label="Download Machine Code" download="code.com"/>
                            </Box>
                        </Tab>
                        {/*<Tab title="x86 Virtual Machine">*/}
                        {/*    <Box pad="medium">*/}
                        {/*        <V86Terminal/>*/}
                        {/*    </Box>*/}
                        {/*</Tab>*/}
                    </Tabs>
                </Box>
                <Box gridArea="footer">
                    <Footer background="dark-1">
                        Status: ...
                    </Footer>
                </Box>
            </Grid>
        </Grommet>
    );
}
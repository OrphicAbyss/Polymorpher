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
import {Nav} from "grommet/components/Nav";
import {Tabs} from "grommet/components/Tabs";
import {Tab} from "grommet/components/Tab";
import {Text} from "grommet/components/Text";

import {Code} from "grommet-icons/icons/Code";
import {Cube} from "grommet-icons/icons/Cube";
import {Desktop} from "grommet-icons/icons/Desktop";
import {List as ListIcon} from "grommet-icons/icons/List";
import {Table} from "grommet-icons/icons/Table";
// import {V86Terminal} from "./v86";
import {schemeCategory10} from "d3-scale-chromatic";

import {scanCode} from "./scanner";
import {tokenise} from "./tokeniser";
import {parse} from "./parser";
import {assemble} from "./assemble";
import {FS} from "./file_store";

import {InstructionLayer, OpCodeLayer} from "./components/instruction_table";
import {About} from "./components/about";
import {Editor} from "./components/editor";
import {Files} from "./components/files";
import {EmulatorDetails} from "./components/emu_details";


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
    const [compLayer, showCompLayer] = React.useState(false);

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
            <InstructionLayer isOpen={insLayer} close={() => showInsLayer(false)}/>
            <OpCodeLayer isOpen={opcodeLayer} close={() => showOpcodeLayer(false)}/>
            <About isOpen={aboutLayer} close={() => showAboutLayer(false)}/>
            <EmulatorDetails isOpen={compLayer} close={() => showCompLayer(false)}/>

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
                    <Header background="dark-1" gap="medium" pad="xsmall">
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
                            <Anchor label="Hardware" icon={<Desktop/>} onClick={() => showCompLayer(true)}/>
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
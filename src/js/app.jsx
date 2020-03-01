"use strict";

import React from "react";
import {Grommet, Header, Tabs, Tab, Box, Heading, Footer, Clock, Button} from "grommet";
import {schemeCategory10} from "d3-scale-chromatic";
import {scanCode} from "./scanner";
import {tokenise} from "./tokeniser";
import {parse} from "./parser";
import {assemble} from "./assemble";


const colourCodes = {};

export function getColor (type) {
    let code = colourCodes[type];
    if (code === undefined) {
        code = Object.keys(colourCodes).length % 10;
        colourCodes[type] = code;
    }
    return schemeCategory10[code];
}


const exampleDosProgram = `; Example DOS program which compiles as a .com file
; Prints 'Hello, world!', waits for a key press, then exits 
    org    100h       

    mov ah,09
    mov dx,msg
    int 21h
    mov ah,08
    int 21h
    int 20h
    msg db "hello world!$"
`;


export default function App () {
    const [code, setCode] = React.useState(exampleDosProgram);
    const codeUpdate = (event) => setCode(event.target.value);

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
    for (let i=0; i<binary.length; i+=8) {
        buffer.push(parseInt(binary.substr(i, 8), 2));
    }
    const blob = new Blob([new Uint8Array(buffer)], {type: "application/binary"});
    const url = URL.createObjectURL(blob);

    return (
        <div>
            <Grommet>
                <Header background="dark-1">
                    {/*<Header background="dark-1" pad="medium">*/}
                    <Box direction="row" align="center" gap="small">
                        <Heading color="white" size="small">
                            WebAssembler
                        </Heading>
                        <div>An online x86 assembler</div>
                    </Box>
                </Header>

                <Tabs>
                    <Tab title="Code">
                        <Box pad="medium">
                            <textarea className="code" rows="20" value={code} onChange={codeUpdate}></textarea>
                        </Box>
                    </Tab>
                    <Tab title="Lexemes">
                        <Box pad="medium">
                            {lexemes.map((token, i) => (<div key={i} style={{color: schemeCategory10[token.type]}}>{token.token}</div>))}
                        </Box>
                    </Tab>
                    <Tab title="Tokens">
                        <Box pad="medium">
                            {tokens.map((token, i) => (<div key={i} style={{color: getColor(token.type)}}>{token.toString() + " " + token.type}</div>))}
                        </Box>
                    </Tab>
                    <Tab title="Parsed">
                        <Box pad="medium">
                            {parsed.map((statement, i) => (<div key={i} style={{color: getColor(statement.getType())}}>{statement.toString() + " " + statement.getType()}</div>))}
                        </Box>
                    </Tab>
                    <Tab title="Binary">
                        <Box pad="medium">
                            {assembled.errors.map((error, i) => (<div key={"e" + i} style={{color: "red"}}>{error}</div>))}
                            {assembled.binaryOutput.map((binary, i) => (<div key={"b" + i}>{binary}</div>))}
                            <Button href={url} label="Download Machine Code" download="code.com"/>
                        </Box>
                    </Tab>
                </Tabs>

                <Footer background="dark-1">

                </Footer>
            </Grommet>
        </div>
    );
}
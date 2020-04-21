"use strict";

import React from "react";
import {Grommet, Header, Tabs, Tab, Text, Box, Heading, Footer, Button} from "grommet";
import {InstructionGrid, InstructionSubGrid, InstructionTable} from "./instruction_table";
import {V86Terminal} from "./v86";
import {schemeCategory10} from "d3-scale-chromatic";
import {scanCode} from "./scanner";
import {tokenise} from "./tokeniser";
import {parse} from "./parser";
import {assemble} from "./assemble";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/ext-beautify";
import "ace-builds/src-noconflict/mode-assembly_x86";

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

const exampleDosMZProgram = `format MZ

entry main:start            ; program entry point
stack 100h                ; stack size

segment main                ; main program segment
start:
mov    ax,text
mov    ds,ax
mov    dx,hello
call    extra:write_text
mov    ax,4C00h
int    21h
segment text
hello db 'Hello world!',24h
segment extra
write_text:
mov    ah,9
int    21h
retf`;

const exampleDosMZ2Program = `format MZ                       ;Исполняемый файл DOS EXE (MZ EXE)
entry code_seg:start            ;Точка входа в программу
stack 200h                      ;Размер стека
;--------------------------------------------------------------------
    segment data_seg                ;Cегмент данных
hello db 'Hello, asmworld!$'    ;Строка
;--------------------------------------------------------------------
    segment code_seg                ;Сегмент кода
start:                          ;Точка входа в программу
mov ax,data_seg             ;Инициализация регистра DS
mov ds,ax
mov ah,09h
mov dx,hello                ;Вывод строки
int 21h
mov ax,4C00h
int 21h                     ;Завершение программы
`;

export default function App () {
    const [code, setCode] = React.useState(exampleDosMZProgram);
    const codeUpdate = (text) => {
        setCode(text);
    };

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
        <Grommet>
            <Header background="dark-1">
                <Box direction="row" align="center" gap="small">
                    <Heading color="white" size="small">
                        WebAssembler
                    </Heading>
                    <div>An online x86 assembler</div>
                </Box>
            </Header>

            <Tabs>
                <Tab title="Instructions">
                    {/*<Box pad="medium">*/}
                    <Box><Heading>Op Code Table</Heading></Box>
                    <Box overflow="scroll"><InstructionGrid/></Box>
                    <Box><Heading>Sub Op Code Table</Heading></Box>
                    <Box><InstructionSubGrid/></Box>
                    <Box><Heading>Instruction List and Details</Heading></Box>
                    <Box><InstructionTable/></Box>
                    {/*</Box>*/}
                </Tab>
                <Tab title="Code">
                    <Box pad="medium">
                        <AceEditor theme="tomorrow" mode="assembly_x86" value={code} onChange={codeUpdate} name="ace" width="100%" fontSize={16}/>
                    </Box>
                </Tab>
                {/*<Tab title="Lexemes">*/}
                {/*    <Box pad="medium">*/}
                {/*        {lexemes.map((token, i) => (<div key={i} style={{color: schemeCategory10[token.type]}}>{token.token}</div>))}*/}
                {/*    </Box>*/}
                {/*</Tab>*/}
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

            <Footer background="dark-1">

            </Footer>
        </Grommet>
    );
}
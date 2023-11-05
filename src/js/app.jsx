"use strict";

import React, {Fragment} from "react";

import {schemeCategory10} from "d3-scale-chromatic";

import {scanCode} from "./assembler/scanner";
import {tokenise} from "./assembler/tokeniser";
import {parse} from "./assembler/parser";
import {assemble} from "./assembler/assemble";
import {FS} from "./file_store";

import {InstructionLayer, OpCodeLayer} from "./components/instruction_table";
import {About} from "./components/about";
import {Editor} from "./components/editor";
import {Files} from "./components/files";
import {EmulatorDetails} from "./components/emu_details";

import {EMU8086} from "./components/8086emu";
import {Window} from "./components/ui-framework";

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

    const toggle = (layer, value) => {
        switch (layer) {
            case "about":
                showAboutLayer(value);
                break;
            case "ins":
                showInsLayer(value);
                break;
            case "opcode":
                showOpcodeLayer(value);
                break;
            case "comp":
                showCompLayer(value);
                break;
            default:
                return;
        }
        if (window.plausible && window.plausible.q) {
            window.plausible.q.push([layer + "-" + value]);
        }
    };

    const show = (layer) => toggle(layer, true);
    const close = (layer) => toggle(layer, false);

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
    };

    const [asmState, setAsmState] = React.useState({
        lexemes: [],
        tokens: [],
        parsed: [],
        assembled: {errors: [], binaryOutput: [], formattedBin: []},
        buffer: [],
        url: ""
    });

    React.useEffect(() => {
        function changeTabs (e) {
            const target = e.target;
            const parent = target.parentNode.parentNode;
            const grandparent = parent.parentNode;

            // Remove all current selected tabs
            parent
                .querySelectorAll("[aria-selected=\"true\"]")
                .forEach(t => t.setAttribute("aria-selected", false));

            // Set this tab as selected
            target.setAttribute("aria-selected", true);

            // Hide all tab panels
            grandparent
                .querySelectorAll("[role=\"tabpanel\"]")
                .forEach(p => p.setAttribute("hidden", true));

            // Show the selected panel
            grandparent.parentNode
                .querySelector(`#${target.getAttribute("aria-controls")}`)
                .removeAttribute("hidden");
        }

        const tabs = document.querySelectorAll("[role=\"tab\"]");
        const tabList = document.querySelector("[role=\"tablist\"]");
        const openTab = document.querySelector("[aria-selected=\"true\"]");

        changeTabs({target: openTab});

        // Add a click event handler to each tab
        tabs.forEach(tab => {
            tab.addEventListener("click", changeTabs);
        });

        // Enable arrow navigation between tabs in the tab list
        let tabFocus = 0;

        tabList.addEventListener("keydown", e => {
            // Move right
            if (e.keyCode === 39 || e.keyCode === 37) {
                tabs[tabFocus].setAttribute("tabindex", -1);
                if (e.keyCode === 39) {
                    tabFocus++;
                    // If we're at the end, go to the start
                    if (tabFocus >= tabs.length) {
                        tabFocus = 0;
                    }
                    // Move left
                } else if (e.keyCode === 37) {
                    tabFocus--;
                    // If we're at the start, move to the end
                    if (tabFocus < 0) {
                        tabFocus = tabs.length - 1;
                    }
                }

                tabs[tabFocus].setAttribute("tabindex", 0);
                tabs[tabFocus].focus();
            }
        });
    }, []);

    React.useEffect(() => {
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

        setAsmState({
            lexemes,
            tokens,
            parsed,
            assembled,
            buffer,
            url
        });
    }, [code]);

    const {
        lexemes,
        tokens,
        parsed,
        assembled,
        buffer,
        url
    } = asmState;

    const [tabIndex, setTabIndex] = React.useState();
    const tabNames = ["Code", "Tokens", "Parsed", "Binary", "Formatted Binary", "x86 Virtual Machine"];

    const onActive = index => {
        setTabIndex(index);
        if (window.plausible && window.plausible.q) {
            window.plausible.q.push([tabNames[index]]);
        }
    };

    const pageTitle = <Fragment><b>WebAssembler</b> - An online x86 assembler and emulator</Fragment>;
    const pageStatus = <Fragment>
        <p className="status-bar-field">{file}</p>
        <p className="status-bar-field">Line: 1</p>
    </Fragment>;

    return (
        <Fragment>
            <InstructionLayer isOpen={insLayer} close={() => close("ins")}/>
            <OpCodeLayer isOpen={opcodeLayer} close={() => close("opcode")}/>
            <About isOpen={aboutLayer} close={() => close("about")}/>
            <EmulatorDetails isOpen={compLayer} close={() => close("comp")}/>
            <Window title={pageTitle} draggable={false} className={"main"} statusBar={pageStatus}>
                <div className="flexRowRev">
                    <button onClick={() => show("comp")}>
                        <div className={"fa fa-desktop"}/>
                        Hardware
                    </button>
                    <button onClick={() => show("opcode")}>
                        <div className={"fa fa-table"}/>
                        Op Codes
                    </button>
                    <button onClick={() => show("ins")}>
                        <div className={"fa fa-list"}/>
                        Instructions
                    </button>
                    <button onClick={() => show("about")}>
                        <div className={"fa fa-info-circle"}/>
                        About
                    </button>
                </div>
                <div className="flexRow flexFill flexGap">
                    <Files fs={fs} loadFile={loadFile} openFile={file} fileChanged={changed}/>
                    <div className="flexRow flexFill">
                        <section className="tabs flexFill">
                            <div>
                                <menu role="tablist" aria-label="Window Tabs">
                                    <button role="tab" aria-selected="true" aria-controls="code">Code</button>
                                    {/*<button role="tab" aria-controls="tokens">Lexemes</button>*/}
                                    <button role="tab" aria-controls="tokens">Tokens</button>
                                    <button role="tab" aria-controls="parsed">Parsed</button>
                                    <button role="tab" aria-controls="binary">Binary</button>
                                    <button role="tab" aria-controls="formattedBinary">Formatted Binary</button>
                                    <button role="tab" aria-controls="x86emu">8086 Virtual Machine</button>
                                </menu>
                            </div>
                            <div className="flexFill fillHolder">
                                <article role="tabpanel" id="code">
                                    <Editor value={code} onChange={codeUpdate}/>
                                </article>
                                {/*<article role="tabpanel" id="lexemes">*/}
                                {/*    {lexemes.map((token, i) => (<div key={i} style={{color: schemeCategory10[token.type]}}>{token.token}</div>))}*/}
                                {/*</article>*/}
                                <article role="tabpanel" id="tokens">
                                    <div className="fillScroll">
                                    {tokens.map((token, i) => (
                                        <div key={i}
                                             style={{color: getColor(token.type)}}>{i}: {token.toString() + " " + token.type}</div>
                                    ))}
                                    </div>
                                </article>
                                <article role="tabpanel" id="parsed">
                                    <div className="fillScroll">
                                    {parsed.map((statement, i) => (
                                        <div key={i}
                                             style={{color: getColor(statement.getType())}}>{i}: {statement.toString() + " " + statement.getType()}</div>
                                    ))}
                                    </div>
                                </article>
                                <article role="tabpanel" id="binary">
                                    <div className="fillScroll">
                                    {assembled.errors.map((error, i) => (
                                        <div key={"e" + i} style={{color: "red"}}>{error}</div>))}
                                    {assembled.binaryOutput.map((binary, i) => (
                                        <div key={"b" + i}>{i}: {binary}</div>))}
                                    <a href={url} download="code.com">
                                        <button>Download Machine Code</button>
                                    </a>
                                    </div>
                                </article>
                                <article role="tabpanel" id="formattedBinary">
                                    <div className="fillScroll">
                                    {assembled.errors.map((error, i) => (
                                        <div key={"e" + i} style={{color: "red"}}>{error}</div>))}
                                    {assembled.formattedBin.map((line, i) => (<div key={"l" + i}>{line}</div>))}
                                    <a href={url} download="code.com">
                                        <button>Download Machine Code</button>
                                    </a>
                                    </div>
                                </article>
                                <article role="tabpanel" id="x86emu">
                                    <EMU8086 bios={buffer}/>
                                </article>
                            </div>
                        </section>
                    </div>
                </div>
            </Window>
        </Fragment>
    );
}

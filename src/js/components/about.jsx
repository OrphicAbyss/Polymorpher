"use strict";

import React, {Fragment} from "react";

import {Modal} from "./ui-framework";

export function About (props) {
    const isOpen = props.isOpen;
    const close = props.close;

    return (
        <Fragment>
            {isOpen && <Modal title="About" onClose={close}>
                <p>
                    An 8086 assembler written in Javascript which lets you download the binary output of the
                    assembled code. It assembles code written in
                    <a href="https://en.wikipedia.org/wiki/X86_assembly_language#Syntax">Intel syntax</a> as
                    this was the syntax style I had used previously on the few occasions in which I wrote
                    assembly code previously. It also tries to match the acceptable input as defined by
                    <a href="https://flatassembler.net/docs.php?article=manual">flat assembler</a> and
                    code is tested against the output of <i>fasm</i>. More advanced features are not
                    supported.
                </p>
                <h4>How did we get here</h4>
                <p>
                    Some time back I was writing some toy compilers/interpreters and after some work in this
                    area became interested in writing a compiler written in Javascript. After embarking on this
                    project, I thought it would be nice to generate the binary output direct from the website.

                    This lead to the idea of writing a assembler, as it's the simplest form of language when
                    generating machine code from it. However in a simple toy language it is unlikely that you
                    would use all the instructions possible. In this way the language drives the required
                    instructions needed. When writing an assembler there is no external drive on what
                    instructions should be possible. So in hindsight, writing an assembler was most likely a
                    more involved project.
                </p>
                <h4>Output formats</h4>
                <p>
                    Currently this assembler supports two output formats Binary output and MZ Executable.
                    Binary output was historically used early in computing. For example DOS .com files use this
                    format. There is no metadata generated, the instructions are directly output to the binary
                    file. For MZ EXE files some simple metadata is included at the start of the file which
                    record references to the different segments in the file so that a exe loader can replace the
                    references with correct memory locations based on where the executable was loaded into
                    memory.
                </p>
                <h4>Current focus</h4>
                <p>
                    The next area being developed is an 8086 emulator in which to run and test code written on
                    this site. This will include writing a BIOS for the emulator to allow a operating system
                    to be run. This work will drive the features created.
                </p>
                <h4>Contact</h4>
                <p>
                    If you find bugs (there are most likely some in binary generation still) or with the general
                    interface you can <a href="mailto:webasm@jorts.solutions">contact me here</a>.
                </p>
            </Modal>
            }
        </Fragment>
    );
}

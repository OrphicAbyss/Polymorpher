"use strict";

import React, {Fragment} from "react";
import {Box} from "grommet/components/Box";
import {Heading} from "grommet/components/Heading";
import {Text} from "grommet/components/Text";
import {Anchor} from "grommet/components/Anchor";
import {ModalLayer} from "./layer";

export function About (props) {
    const isOpen = props.isOpen;
    const close = props.close;

    return (
        <Fragment>
            <ModalLayer title="About" isOpen={isOpen} close={close}>
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
            </ModalLayer>
        </Fragment>
    );
}
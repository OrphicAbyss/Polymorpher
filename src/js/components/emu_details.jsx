"use strict";

import React, {Fragment} from "react";

import {Box} from "grommet/components/Box";
import {Heading} from "grommet/components/Heading";
import {Text} from "grommet/components/Text";

import {ModalLayer} from "./layer";

export function EmulatorDetails (props) {
    const isOpen = props.isOpen;
    const close = props.close;

    return (
        <Fragment>
            <ModalLayer title="8086 Hardware" subTitle="Emulator Details" isOpen={isOpen} close={close}>
                <Box overflow="auto" pad="small">
                    <Text>
                        The following specifications detail the computer emulated to run the binary code assembled
                        by this 8086 assembler. <b>This is a work in progress.</b>
                    </Text>
                    <Heading level="4">Boot Process</Heading>
                    <Text>
                        Currently 256 KiB of RAM is allocated, the binary for the currently selected ASM file is loaded
                        at the address 0xF0000. The CS register is loaded with 0xF000 and the IP is set to 0x0000. This
                        makes the full <i>Reset Vector</i> address 000F_0000h which is incorrect for most PCs. However
                        until the assembler supports padding instructions to a specific location it simplifies the
                        testing process.<br/>
                        <br/>
                        The CPU then executes instructions for up to 100 instructions unless an error is encountered.
                        The instructions executed are printed as are error details that stop the emulator. A BIOS is
                        in the process of being written.
                    </Text>
                </Box>
            </ModalLayer>
        </Fragment>
    );
}

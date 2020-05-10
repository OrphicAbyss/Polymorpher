"use strict";

import React, {Fragment} from "react";

import {Box} from "grommet/components/Box";
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
                        by this 8086 assembler.
                    </Text>
                    {/*<Heading level="4">How did we get here</Heading>*/}
                </Box>
            </ModalLayer>
        </Fragment>
    );
}

"use strict";

import React, {Fragment} from "react";

import {Box} from "grommet/components/Box";
import {Cube} from "grommet-icons/icons/Cube";
import {Heading} from "grommet/components/Heading";
import {Text} from "grommet/components/Text";
import {Nav} from "grommet/components/Nav";
import {Button} from "grommet/components/Button";
import {FormClose} from "grommet-icons/icons/FormClose";
import {Header} from "grommet/components/Header";
import {Layer} from "grommet/components/Layer";

export function ModalLayer (props) {
    const close = props.close;
    const title = props.title;
    const subTitle = props.subTitle;
    const children = props.children;
    const isOpen = props.isOpen;

    return (
        <Fragment>
        {isOpen && (
            <Layer modal onEsc={close} onClickOutside={close}>
                <Header background="dark-2" pad="small" gap="medium">
                    <Box direction="row" align="center" gap="small">
                        <Cube/>
                        <Heading size="small">{title}</Heading>
                        <Text>{subTitle}</Text>
                    </Box>
                    <Nav direction="row">
                        <Button label="close" icon={<FormClose/>} onClick={close}/>
                    </Nav>
                </Header>
                {children}
            </Layer>
        )}
        </Fragment>
    );
}
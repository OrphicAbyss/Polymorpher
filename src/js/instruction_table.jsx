"use strict";

import React from "react";
import {Box, DataTable, Text} from "grommet";
import {instructions} from "./instruction";

export function InstructionTable (props) {
    return (
        <DataTable
            columns={[
                {
                    property: "key",
                    header: <Text>Instruction</Text>,
                    primary: true
                },
                {
                    property: "name",
                    header: <Text>Description</Text>
                },
                {
                    property: "instruction",
                    header: <Text>Instruction Format</Text>,
                    render: datum => (datum.opcodes || []).map((op, i) => <Box key={i}><Text>{datum.key} <i>{op.toInstructionString()}</i></Text></Box>)
                },
                {
                    property: "opcodes",
                    header: <Text>Op Codes</Text>,
                    render: datum => (datum.opcodes || []).map((op, i) => <Box key={i}><Text>{op.toOpCodeString()}</Text></Box>)
                }
            ]}
            data={instructions}
        />
    );
}
"use strict";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-beautify";
import "ace-builds/src-noconflict/mode-assembly_x86";
import React from "react";

export function Editor (props) {
    const {value, onChange} = props;

    return (
        // <TextArea value={code} onChange={codeUpdate}></TextArea>
        <AceEditor
            theme="tomorrow"
            mode="assembly_x86"
            value={value}
            onChange={onChange}
            name="ace" width="100%" fontSize={16}
        />
    )
}


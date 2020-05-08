"use strict";

import React from "react";
import {Box} from "grommet/components/Box";
import {Button} from "grommet/components/Button";

export function V86Terminal (props) {
    const termRef = React.useRef("v86-ref");
    const [run, setRun] = React.useState(false);
    const [emulator, setEmulator] = React.useState(null);

    React.useEffect(() => {
        if (run) {
            if (!emulator) {
                console.log("Creating emulator");
                // let v86Starter = new V86Starter({
                //     screen_container: termRef.current,
                //     bios: {
                //         url: "/bios/seabios.bin"
                //     },
                //     vga_bios: {
                //         url: "/bios/vgabios.bin"
                //     },
                //     fda: {
                //         url: "/images/freedos722.img"
                //     },
                //     auto_start: true
                // });

                console.log("Storing emulator in state");
                // setEmulator(v86Starter);
            } else {
                console.log("Starting emulator");
                emulator.run();
            }
        } else {
            if (emulator) {
                console.log("Stopping emulator");
                emulator.stop();
            } else {
                console.log("No emulator to stop");
            }
        }
    }, [run]);

    React.useEffect(() => {
        // unmount of component cleanup
        return () => {
            if (emulator) {
                console.log("Destroying emulator");
                emulator.distroy();
                setEmulator(null);
            } else {
                console.log("Component unmount, but no emulator");
            }
        };
    }, []);

    return (
        <Box>
            <Button onClick={() => setRun(!run)}>{!run ? "Start" : "Stop"}</Button>
            <div id="v86" ref={termRef}>
                <div style={{whiteSpace: "pre", font: "14px 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace", lineHeight: "14px"}}></div>
                <canvas></canvas>
            </div>
        </Box>
    );
}
"use strict";

import React from "react";
import {createRoot} from "react-dom/client";
import App from "./js/app";

export function run() {
    console.log("Starting app...");

    const domRoot = document.getElementById("react-root");
    const root = createRoot(domRoot);
    root.render(<App/>);
}

run();


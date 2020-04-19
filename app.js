"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3333;

function onRequest(request, response) {
    let pathname = request.url;
    console.log("Request for " + pathname + " received.");

    if (pathname === "/") {
        pathname = "/index.html";
    }

    if (pathname.startsWith("/bios/") || pathname.startsWith("/build/") || pathname.startsWith("/images/")) {
        pathname = "./node_modules/v86/" + pathname;
    } else {
        pathname = "./dist/" + pathname;
    }

    const ext = path.extname(pathname);

    let content = "text/html";
    switch (ext) {
        case ".js":
            content = "text/javascript";
            break;
        case ".css":
            content = "text/css";
            break;
        case ".bin":
            content = "application/octet-stream";
            break;
    }

    try {
        if (fs.existsSync(pathname) && !fs.statSync(pathname).isDirectory()) {
            const stream = fs.createReadStream(pathname);
            response.writeHead(200, {"Content-Type": content});
            stream.pipe(response);
        } else {
            response.writeHead(404);
            response.end();
        }
    } catch (e) {
        console.log(e);
        response.writeHead(404);
        response.end();
    }
}

http.createServer(onRequest).listen(port);
console.log("HTTP Server has started on port: " + port);
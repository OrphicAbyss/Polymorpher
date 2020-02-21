"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 3333;

function onRequest(request, response) {
    var pathname = request.url,
        content = "text/html";

    console.log("Request for " + pathname + " received.");

    if (pathname === "/") {
        pathname = "/index.html";
    }

    pathname = "./src/" + pathname;
    const ext = path.extname(pathname);

    switch (ext) {
        case ".js":
            content = "text/javascript";
            break;
        case ".css":
            content = "text/css";
            break;
    }

    try {
        if (fs.existsSync(pathname)) {
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
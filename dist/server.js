"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const logger_1 = require("./lib/logger");
const lighthouse_1 = require("./lighthouse");
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
http.createServer(async function (req, res) {
    const { url: qUrl, type } = url.parse(req.url, true).query;
    res.setHeader('Content-Type', type === 'json' ? 'application/json' : 'text/html');
    try {
        res.write(await lighthouse_1.default(qUrl, type));
    }
    catch (e) {
        logger_1.default.error(e);
        res.statusCode = 400;
        res.write("Error: " + e.message);
    }
    res.end();
})
    .listen(8080);
logger_1.default.info(`v${packageJson.version} listening on 8080`);

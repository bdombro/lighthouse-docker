"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const logger_1 = require("./lib/logger");
const lighthouse_1 = require("./lighthouse");
const isProd = process.env.NODE_ENV === 'production';
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
async function handler(event, context) {
    logger_1.default.info(`Received event on version ${packageJson.version}: ${JSON.stringify(event)}`);
    let body;
    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
    };
    const { url, type } = event.queryStringParameters;
    try {
        if (!url)
            throw new Error('url query param is required.');
        switch (event.httpMethod) {
            case 'GET':
                body = await lighthouse_1.default(url, type);
                break;
            default:
                throw new Error(`Unsupported method "${event.httpMethod}"`);
        }
    }
    catch (err) {
        if (!isProd)
            throw err;
        else
            logger_1.default.error(err);
        statusCode = '400';
        body = err.message;
    }
    // finally {
    // 	body = JSON.stringify(body, null, 2);
    // }
    return {
        statusCode,
        body,
        headers,
    };
}
exports.default = handler;
;

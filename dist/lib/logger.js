"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debugMode = process.env.DEBUG;
exports.default = {
    info: console.info,
    debug: debugMode ? console.debug : (...p) => null,
    error: console.error,
};

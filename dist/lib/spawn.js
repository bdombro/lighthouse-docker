"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const logger_1 = require("./logger");
const spawnExt = Object.assign(child_process_1.spawn, {
    // child.kill() doesn't always work. Use this if it doesnt.
    kill(pid) {
        logger_1.default.debug("Killing PID: " + pid);
        return new Promise(resolve => {
            const killChild = child_process_1.spawn('pkill', ['-P', `${pid}`]);
            killChild.on('exit', resolve);
            killChild.on('error', (error) => {
                logger_1.default.error(`killChild process errored with error ${error}`);
            });
        });
    }
});
exports.default = spawnExt;

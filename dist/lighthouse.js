"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = require("fs");
const lighthouse = require('lighthouse');
const async_1 = require("./lib/async");
const logger_1 = require("./lib/logger");
let runningLock = false;
let jobCount = 0;
let chromeLaunched = 0;
chromeLauncher();
async function lighthouseRunner(url, type = 'html') {
    const reqNo = ++jobCount;
    logger_1.default.info(`Queud #${reqNo}:${url}`);
    await async_1.waitForTruthy(() => !runningLock, { timeout: 2 * 60 * 1000 });
    logger_1.default.info(`Running #${reqNo}:${url}`);
    runningLock = true;
    logger_1.default.info('1. Awaiting Chrome');
    await chromeLauncher();
    // Run lighthouse twice and skip the first, to ensure that caches are pumped for the second
    const runner = () => lighthouse(url, { logLevel: 'error', output: type, onlyCategories: ['performance'], port: 9223 });
    logger_1.default.info('2. Pumping caches');
    await runner();
    logger_1.default.info('3. Running audit');
    const runnerResult = await runner();
    // `.lhr` is the Lighthouse Result as a JS object
    logger_1.default.info(`Result #${reqNo}:${url}: ${runnerResult.lhr.categories.performance.score * 100}`);
    runningLock = false;
    return runnerResult.report;
}
exports.default = lighthouseRunner;
async function chromeLauncher() {
    if (chromeLaunched++) {
        await async_1.waitForTruthy(isChromeReady);
        await async_1.delay(10000);
        return;
    }
    const chromePath = await findChrome();
    logger_1.default.debug("Launching chrome with path: " + chromePath);
    const child = child_process_1.spawn(chromePath, [
        '--ignore-certificate-errors',
        '--remote-debugging-port=9223',
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--homedir=/tmp',
        '--single-process',
        '--data-path=/tmp/data-path',
        '--disk-cache-dir=/tmp/cache-dir',
        '--autoplay-policy=user-gesture-required',
        '--user-data-dir=/tmp/chromium',
        '--disable-web-security',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-domain-reliability',
        '--disable-extensions',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-sync',
        '--disk-cache-size=33554432',
        '--hide-scrollbars',
        '--ignore-gpu-blocklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-sandbox',
        '--no-zygote',
        '--password-store=basic',
        '--use-gl=swiftshader',
        '--use-mock-keychain',
    ], { cwd: require('os').tmpdir(), shell: true });
    child.stdout.on('data', (data) => {
        logger_1.default.debug(`stdout: ${data}`);
    });
    child.stderr.on('data', (data) => {
        logger_1.default.debug(`stderr: ${data}`);
    });
    child.on('close', (code) => {
        logger_1.default.debug(`child process closed with code ${code}`);
    });
    child.on('error', (error) => {
        logger_1.default.debug(`child process errored with error ${error}`);
    });
    child.on('exit', (code) => {
        logger_1.default.debug(`child process exited with code ${code}`);
    });
    await async_1.waitForTruthy(isChromeReady, { timeout: 2 * 60 * 1000 });
    await async_1.delay(10000);
    return;
    function findChrome() {
        var _a;
        const execPath = (_a = [
            '/usr/bin/chromium-browser',
            '/usr/bin/google-chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ]
            .filter(p => fs.existsSync(p))) === null || _a === void 0 ? void 0 : _a[0];
        if (!execPath)
            throw new Error('Can\'nt find Chrome');
        return execPath;
    }
    async function isChromeReady() {
        const net = require("net");
        return new Promise((resolve) => {
            const client = net.createConnection(9223);
            client.once('error', () => {
                logger_1.default.debug('Chrome is not ready');
                cleanup(client);
                resolve(0);
            });
            client.once('connect', () => {
                logger_1.default.debug('Chrome is ready');
                cleanup(client);
                resolve(1);
            });
        });
        function cleanup(client) {
            if (client) {
                client.removeAllListeners();
                client.end();
                client.destroy();
                client.unref();
            }
        }
    }
}

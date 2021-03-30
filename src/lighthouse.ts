import { spawn } from 'child_process'
import * as fs from 'fs'
import type { SpawnError } from './@types/child_process'

import type lhtypes from 'lighthouse/types/externs'
const lighthouse = require('lighthouse') as (url: string, options: Partial<LH.CliFlags>) => LH.RunnerResult

import {waitForTruthy} from './lib/async'
import logger from './lib/logger'

let runningLock = false
let jobCount = 0
let chromeLaunched = 0
chromeLauncher()

export default async function lighthouseRunner(url: string, type = 'html') {
  const reqNo = ++jobCount
  logger.info(`Queud #${reqNo}:${url}`)
  await waitForTruthy(() => !runningLock, {timeout: 2 * 60 * 1000})
  logger.info(`Running #${reqNo}:${url}`)
  runningLock = true
  logger.info('1. Awaiting Chrome')
  await chromeLauncher()

  logger.info('2. Running audit')
  const runnerResult = await lighthouse(url, {
    logLevel: 'error', 
    output: type as any, 
    onlyCategories: ['performance'], 
    port: 9223,
    extraHeaders:  {
      ...process.env.HTTPHEADERS && JSON.parse(process.env.HTTPHEADERS)
    },
  })

	// `.lhr` is the Lighthouse Result as a JS object
	logger.info(`Result #${reqNo}:${url}: ${runnerResult.lhr.categories.performance.score * 100}`)

  runningLock = false
  return runnerResult.report as string
}

async function chromeLauncher() {
  if (chromeLaunched++) {
    await waitForTruthy(isChromeReady)
    return
  }
  const chromePath = await findChrome()

  logger.debug("Launching chrome with path: " + chromePath)

  const child = spawn(chromePath, [
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
  ], {cwd: require('os').tmpdir(), shell: true } )

  child.stdout.on( 'data', ( data: string ) => {
    logger.debug( `stdout: ${ data }` )
  } )

  child.stderr.on( 'data', ( data: string ) => {
    logger.debug( `stderr: ${ data }` )
  } )

  child.on( 'close', ( code: number | null ) => {
    logger.debug( `child process closed with code ${ code }` )
  } )

  child.on( 'error', ( error: SpawnError ) => {
    logger.debug( `child process errored with error ${ error }` )
  } )

  child.on( 'exit', ( code: number | null ) => {
    logger.debug( `child process exited with code ${ code }` )
  } )

  await waitForTruthy(isChromeReady, {timeout: 2 * 60 * 1000})
  return


  function findChrome() {
    const execPath = [
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium'
    ]
      .filter(p => fs.existsSync(p))
      ?.[0]
    if (!execPath) throw new Error('Can\'nt find Chrome')
    return execPath
  }

  async function isChromeReady() {
    const net = require("net")
    return new Promise((resolve) => {
      const client = net.createConnection(9223)
      client.once('error', () => {
        logger.debug('Chrome is not ready')
        cleanup(client)
        resolve(0)
      })
      client.once('connect', () => {
        logger.debug('Chrome is ready')
        cleanup(client)
        resolve(1)
      })
    })

    function cleanup(client: any) {
      if (client) {
        client.removeAllListeners()
        client.end()
        client.destroy()
        client.unref()
      }
    }
  }
}

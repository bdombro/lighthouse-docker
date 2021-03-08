import * as http from 'http'
import * as url from 'url'
import * as fs from 'fs'
import * as path from 'path'
import logger from './lib/logger'
import lighthouse from './lighthouse'

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'))

http.createServer(async function (req, res) {
  const {url: qUrl, type} = url.parse(req.url as string, true).query;

  res.setHeader('Content-Type', type === 'json' ? 'application/json' : 'text/html')
  
  try {
    res.write(await lighthouse(qUrl as string, type as string))
  } catch (e) {
    logger.error(e)
    res.statusCode = 400
    res.write("Error: " + e.message)
  }
  res.end()
})
  .listen(8080)

logger.info(`v${packageJson.version} listening on 8080`)
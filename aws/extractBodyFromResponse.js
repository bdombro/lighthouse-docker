/**
 * Parses the JSON of a lambda response and prints the body field to console.
 */
const fs = require('fs')

try {
  const responsePath = process.argv[2]
  if (!responsePath) return console.log(`usage: node ${__filename} <responsePath>`)
  process.stdout.write(JSON.parse(fs.readFileSync(responsePath, 'utf-8')).body)
} catch (e) {
  // console.error(fs.readFileSync(responsePath, 'utf-8'))
  // throw e
}
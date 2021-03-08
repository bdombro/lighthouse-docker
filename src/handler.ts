import * as fs from 'fs'
import * as path from 'path'
import logger from './lib/logger'
import lighthouse from "./lighthouse"

const isProd = process.env.NODE_ENV === 'production'

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'))

export default async function handler (event: {httpMethod: string, queryStringParameters: Record<string, string>}, context: any) {
	logger.info(`Received event on version ${packageJson.version}: ${JSON.stringify(event)}`)

	let body;
	let statusCode = '200';
	const headers = {
		'Content-Type': 'application/json',
	};

  const {url, type} = event.queryStringParameters

	try {
    if (!url) throw new Error('url query param is required.')
		switch (event.httpMethod) {
			case 'GET':
				body = await lighthouse(url, type)
				break
			default:
				throw new Error(`Unsupported method "${event.httpMethod}"`)
		}
	} catch (err) {
		if (!isProd) throw err
    else logger.error(err)
		statusCode = '400'
		body = err.message
	} 
  // finally {
	// 	body = JSON.stringify(body, null, 2);
	// }

	return {
		statusCode,
		body,
		headers,
	}
};


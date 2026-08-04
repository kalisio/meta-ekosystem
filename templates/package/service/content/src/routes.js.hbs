import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import makeDebug from 'debug'

const debug = makeDebug('{{ name }}:routes')
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default async function (app) {
  const packageInfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json')))
  const apiPath = app.get('apiPath')

  app.get(`${apiPath}/healthcheck`, (req, res) => {
    debug(`${req.method} ${req.originalUrl}`)
    const response = {
      name: '{{ name }}',
      // Allow to override version number for custom build
      version: (process.env.VERSION ? process.env.VERSION : packageInfo.version)
    }
    if (process.env.BUILD_NUMBER) {
      response.buildNumber = process.env.BUILD_NUMBER
    }
    res.json(response)
  })

  // Additional routes here
}

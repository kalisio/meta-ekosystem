const path = require('node:path')
const winston = require('winston')

const host = process.env.HOSTNAME || 'localhost'
const port = process.env.PORT || 8081
const apiPath = process.env.API_PREFIX || '/api'
/* please refer to https://web.dev/articles/how-to-use-local-https for setup */
const https = null
const baseUrl = process.env.BASE_URL || (https ? `https://${host}:${port}${apiPath}` : `http://${host}:${port}${apiPath}`)

module.exports = {
  host,
  port,
  https,
  baseUrl,
  apiPath,
  logs: {
    Console: {
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      level: (process.env.NODE_ENV === 'development' ? 'verbose' : 'info')
    },
    DailyRotateFile: {
      format: winston.format.json(),
      dirname: path.join(__dirname, '..', 'logs'),
      filename: '{{ name }}-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d'
    }
  }
}

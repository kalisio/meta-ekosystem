import fs from 'node:fs'
import https from 'node:https'
import winston from 'winston'
import 'winston-daily-rotate-file'
import compress from 'compression'
import cors from 'cors'
import helmet from 'helmet'
import feathers from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import express from '@feathersjs/express'
import distribution from '@kalisio/feathers-distributed'
import hooks from './hooks.js'
import channels from './channels.js'
import middlewares from './middlewares.js'
import routes from './routes.js'

const { rest } = express

export async function createServer () {
  const app = express(feathers())

  // Override Feathers configure that do not manage async operations,
  // here we also simply call the function given as parameter but await for it
  app.configure = async function (fn) {
    await fn.call(this, this)
    return this
  }
  await app.configure(configuration())

  // Setup distribution
  const distributionConfig = app.get('distribution')
  if (distributionConfig) await app.configure(distribution(distributionConfig))

  // Enable CORS, security, compression, and body parsing
  app.use(cors(app.get('cors')))
  app.use(helmet(app.get('helmet')))
  app.use(compress(app.get('compression')))
  const bodyParserConfig = app.get('bodyParser')
  app.use(express.json(bodyParserConfig?.json))
  app.use(express.urlencoded({ extended: true, ...bodyParserConfig?.urlencoded }))

  // Setup plugins and providers
  await app.configure(rest())

  // Setup logger
  const logConfig = app.get('logs')
  const logPath = logConfig?.DailyRotateFile?.dirname || 'logs'
  // This will ensure the log directory does exist
  fs.mkdirSync(logPath, { recursive: true })
  app.logger = winston.createLogger({
    level: (process.env.NODE_ENV === 'development' ? 'verbose' : 'info'),
    transports: [
      new winston.transports.Console(logConfig.Console),
      new winston.transports.DailyRotateFile(logConfig.DailyRotateFile)
    ]
  })

  // Handle top lever errors
  process.on('unhandledRejection', (reason, p) =>
    app.logger.error('Unhandled Rejection: ', reason)
  )
  process.on('SIGINT', async () => {
    app.logger.info('Received SIGINT signal running teardown')
    await app.teardown()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    app.logger.info('Received SIGTERM signal running teardown')
    await app.teardown()
    process.exit(0)
  })

  // Register hooks
  app.hooks(hooks)
  // Set up real-time event channels
  await app.configure(channels)
  // Configure API routes
  await app.configure(routes)
  // Configure middlewares - always has to be last
  await app.configure(middlewares)

  // Last lauch server
  const httpsConfig = app.get('https')
  let server
  if (httpsConfig) {
    const port = httpsConfig.port || app.get('port')
    server = https.createServer({
      key: fs.readFileSync(httpsConfig.key),
      cert: fs.readFileSync(httpsConfig.cert)
    }, app)
    app.logger.info('Configuring HTTPS server at port ' + port.toString())
    server = await server.listen(port)
  } else {
    const port = app.get('port')
    app.logger.info('Configuring HTTP server at port ' + port.toString())
    server = await app.listen(port)
  }
  server.on('close', () => {
    if (distributionConfig) distribution.finalize(app)
  })
  server.app = app
  server.app.logger.info('Server started listening')

  return server
}

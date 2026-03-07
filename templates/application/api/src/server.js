import fs from 'node:fs'
import _ from 'lodash'
import express from '@feathersjs/express'
import { kdk } from '@kalisio/kdk/core.api.js'
import distribution, { finalize } from '@kalisio/feathers-distributed'
import middlewares from './middlewares.js'
import services from './services.js'
import hooks from './hooks.js'
import channels from './channels.js'

export class Server {
  constructor () {
    this.app = kdk()
    // Listen to distributed services
    const distConfig = this.app.get('distribution')
    if (distConfig) this.app.configure(distribution(distConfig))
    // Serve pure static assets
    if (process.env.NODE_ENV === 'production') {
      this.app.use('/', express.static(this.app.get('distPath')))
    }
  }

  async run () {
    const app = this.app
    // First try to connect to DB
    await app.db.connect()
    // Set up our services
    await app.configure(services)
    // Register hooks
    app.hooks(hooks)
    app.hooks({
      setup: [],
      teardown: [
        async () => {
          await app.db.disconnect()
          app.logger.info('Server has been shut down')
        }
      ]
    })
    // Set up real-time event channels
    app.configure(channels)
    // Configure middlewares - always has to be last
    app.configure(middlewares)
    /// Last launch server
    const port = app.get('port')
    app.logger.info('Configuring HTTP server at port ' + port.toString())
    const expressServer = await app.listen(port)
    expressServer.on('close', () => finalize(app))
    return expressServer
  }
}

export function createServer () {
  const server = new Server()
  const config = server.app.get('logs')
  const logPath = _.get(config, 'DailyRotateFile.dirname')
  if (logPath) {
    // This will ensure the log directory does exist
    fs.mkdirSync(logPath, { recursive: true })
  }
  process.on('unhandledRejection', (reason, p) =>
    server.app.logger.error('Unhandled Rejection at: Promise ', reason)
  )
  process.on('SIGINT', async () => {
    server.app.logger.info('Received SIGINT signal running teardown')
    await server.app.teardown()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    server.app.logger.info('Received SIGTERM signal running teardown')
    await server.app.teardown()
    process.exit(0)
  })
  return server
}

export async function runServer (server) {
  const expressServer = await server.run()
  server.app.logger.info(`Server with pid ${process.pid} started listening`)
  return expressServer
}

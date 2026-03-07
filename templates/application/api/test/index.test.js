import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, afterAll, expect } from 'vitest'
import { createServer } from '../src/server.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('teams', () => {
  let server, expressServer, userService

  it('is ES module compatible', () => {
    expect(typeof createServer).toBe('function')
  })

  it('initialize the server', async () => {
    server = createServer()
    expressServer = await server.run()
  }, 10000)

  it('registers the services', () => {
    userService = server.app.getService('users')
    expect(userService).toBeDefined()
  })

  afterAll(async () => {
    if (expressServer) await expressServer.close()

    const logsDir = path.join(__dirname, 'logs')

    fs.rmSync(logsDir, { recursive: true, force: true })
    fs.mkdirSync(logsDir, { recursive: true })

    await server.app.db.instance.dropDatabase()
    await server.app.db.disconnect()
  })
})

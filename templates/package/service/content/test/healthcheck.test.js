import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { createServer } from '../src/server.js'

describe('healthcheck', () => {
  let server
  let baseUrl

  beforeAll(async () => {
    server = await createServer()
    const app = server.app
    baseUrl = `http://localhost:${app.get('port')}${app.get('apiPath')}`
  })

  afterAll(async () => {
    await server.app.teardown()
    server.close()
  })

  it('returns service name and version', async () => {
    const response = await fetch(`${baseUrl}/healthcheck`)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.name).toBe('{{ name }}')
    expect(body.version).toBeDefined()
  })

  it('includes buildNumber when BUILD_NUMBER is set', async () => {
    process.env.BUILD_NUMBER = '42'
    const response = await fetch(`${baseUrl}/healthcheck`)
    const body = await response.json()
    expect(body.buildNumber).toBe('42')
    delete process.env.BUILD_NUMBER
  })
})

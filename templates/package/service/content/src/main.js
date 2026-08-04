#!/usr/bin/env node

import { createServer } from './server.js'

async function run () {
  try {
    await createServer()
  } catch (error) {
    console.trace('Failed to start server', error)
    process.exit(1)
  }
}

run()

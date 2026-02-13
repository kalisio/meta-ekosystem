#!/usr/bin/env node
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

spawn('plop', ['monorepo'], {
  cwd: rootDir,
  stdio: 'inherit'
})
#!/usr/bin/env node
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const metaRepoDir = path.resolve(__dirname, '..')
const plopBin = path.join(metaRepoDir, 'node_modules', '.bin', process.platform === 'win32' ? 'plop.cmd' : 'plop')

spawn(
  plopBin,
  [
    'monorepo',
    '--plopfile',
    path.join(metaRepoDir, 'plopfile.js')
  ],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  }
)

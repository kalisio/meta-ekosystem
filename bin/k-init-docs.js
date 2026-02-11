#!/usr/bin/env node
import { Plop, run } from 'plop'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

Plop.prepare({
  cwd: rootDir,
  configPath: path.join(rootDir, 'plopfile.js'),
  preload: [],
  completion: () => {}
}, env => 
  Plop.execute(env, env => {
    const options = {
      ...env,
      generator: 'vitepress',
      dest: process.cwd()  // user directory
    }
    return run(options, undefined, true)
  })
)
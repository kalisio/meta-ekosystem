#!/usr/bin/env node
import { Plop, run } from 'plop'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(__dirname, '..')

// Retrieve the generator
const generator = process.argv[2]
if (!generator) {
  console.error('Usage: k-run-plop <monorepo|vitepress>')
  process.exit(1)
}

// Run plop with the given generator 
Plop.prepare({
  cwd: packageRoot,
  configPath: path.join(packageRoot, 'plopfile.js'),
  preload: [],
  completion: () => {}
}, env => 
  Plop.execute(env, env => {
    const options = {
      ...env,
      generator
    }
    return run(options, undefined, true)
  })
)
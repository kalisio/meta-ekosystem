#!/usr/bin/env node
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import nodePlop from 'node-plop'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const metaRepoDir = path.resolve(__dirname, '..')
const plopfilePath = path.join(metaRepoDir, 'plopfile.js')
const cmdDir = path.resolve(process.cwd())

// Ensure the command is run within a monorepo
const workspacePath = path.join(cmdDir, 'pnpm-workspace.yaml')
if (!fs.existsSync(workspacePath)) {
  console.error(chalk.red('❌ You must be in a monorepo directory to run this command!'))
  process.exit(1)
}

// Run plop generator
try {
  const plop = await nodePlop(plopfilePath, { cwd: metaRepoDir })
  const generator = plop.getGenerator('package')
  if (!generator) throw new Error('❌ Generator \'package\' not found')
  const answers = await generator.runPrompts()
  await generator.runActions({
    ...answers,
    dest: cmdDir
  })
  console.log(chalk.green(`✅ Package '${answers.name}' initialized successfully!`))
} catch (error) {
  console.error(chalk.red('❌ Error initializing package:', error))
  process.exit(1)
}

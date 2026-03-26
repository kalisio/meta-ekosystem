#!/usr/bin/env node
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import nodePlop from 'node-plop'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const metaRepoDir = path.resolve(__dirname, '..')
const plopfilePath = path.join(metaRepoDir, 'plopfile.js')

try {
  const plop = await nodePlop(plopfilePath, { cwd: metaRepoDir })
  const generator = plop.getGenerator('monorepo')
  if (!generator) throw new Error('❌ Generator \'nonorepo\' not found')
  const answers = await generator.runPrompts()
  await generator.runActions({
    ...answers,
    dest: process.cwd()
  })
  console.log(chalk.green(`✅ Monorepo '${answers.name}' initialized successfully!`))
} catch (error) {
  console.error(chalk.red('❌ Error initializing monorepo:', error))
  process.exit(1)
}

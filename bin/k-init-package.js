#!/usr/bin/env node
import path from 'path'
import { fileURLToPath } from 'url'
import nodePlop from 'node-plop'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const metaRepoDir = path.resolve(__dirname, '..')
const plopfilePath = path.join(metaRepoDir, 'plopfile.js')

try {
  const plop = await nodePlop(plopfilePath, { cwd: metaRepoDir })
  const generator = plop.getGenerator('package')
  if (!generator) throw new Error('❌ Generator \'package\' not found')
  const answers = await generator.runPrompts()
  await generator.runActions({
    ...answers,
    dest: process.cwd()
  })
  console.log(`✅ Package '${answers.name}' initialized successfully!`)
} catch (error) {
  console.error('❌ Error initializing package:', error)
  process.exit(1)
}

#!/usr/bin/env node
import path from 'path'
import { fileURLToPath } from 'url'
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
  console.log(`✅ Monorepo '${answers.name}' initialized successfully!`)
} catch (error) {
  console.error('❌ Error initializing monorepo:', error)
  process.exit(1)
}

#!/usr/bin/env node
import path from 'path'
import { fileURLToPath } from 'url'
import nodePlop from 'node-plop'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const metaRepoDir = path.resolve(__dirname, '..')
const plopfilePath = path.join(metaRepoDir, 'plopfile.js')

try {
  const plop = await nodePlop(plopfilePath, { cwd: metaRepoDir })
  const generator = plop.getGenerator('vitepress')
  if (!generator) throw new Error('❌ Generator \'vitepress\' not found')
  await generator.runActions({
    dest: process.cwd()
  })
  console.log('✅ Documentation initialized successfully!')
} catch (error) {
  console.error('❌ Error initializing documentation:', error)
  process.exit(1)
}

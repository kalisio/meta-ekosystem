#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { parse, stringify } from 'yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cmdDir = path.resolve(process.cwd())

// Ensure the command is run within a monorepo
const workspacePath = path.join(cmdDir, 'pnpm-workspace.yaml')
if (!fs.existsSync(workspacePath)) {
  console.error(chalk.red('❌ You must be in a monorepo directory to run this command!'))
  process.exit(1)
}

// Read the meta catalog file
let metaCatalog
const metacatalogPath = path.resolve(__dirname, '..', 'catalog.json')
if (!fs.existsSync(metacatalogPath)) {
  console.error(chalk.red('❌ Failed to read meta catalog file: catalog.json file not found'))
  process.exit(1)
}
try {
  metaCatalog = JSON.parse(fs.readFileSync(metacatalogPath))
} catch (error) {
  console.error(chalk.red('❌ Failed to read meta catalog file:', error))
  process.exit(1)
}

// Read the local catalog file
let localCatalog = {}
const localCatalogPath = path.join(cmdDir, 'catalog.json')
if (fs.existsSync(localCatalogPath)) {
  try {
    localCatalog = JSON.parse(fs.readFileSync(localCatalogPath))
  } catch (error) {
    console.error(chalk.red('❌ Failed to read local catalog file:', error))
    process.exit(1)
  }
}

// Merge catalogs and sort the global catalog
const mergedCatalog = { ...metaCatalog, ...localCatalog }
const sortedCatalog = Object.keys(mergedCatalog)
  .sort()
  .reduce((acc, key) => {
    acc[key] = mergedCatalog[key]
    return acc
  }, {})

// Read the pnpm-workspace.yaml file
let workspace
try {
  workspace = parse(fs.readFileSync('./pnpm-workspace.yaml', 'utf8'))
} catch (error) {
  console.error(chalk.red('❌ Failed to read pnpm workspace file:', error))
  process.exit(1)
}

// Assign the global catalog to the workspace
workspace.catalog = sortedCatalog
fs.writeFileSync(workspacePath, stringify(workspace), 'utf8')

console.log(chalk.green('✅ catalog synced successfully!'))

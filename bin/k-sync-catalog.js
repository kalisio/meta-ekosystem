#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { parse, stringify } from 'yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cmdDir = path.resolve(process.cwd())

// Ensure the command is run within a monorepo
const packagePath = path.join(cmdDir, 'package.json')
if (!fs.existsSync(packagePath)) {
  console.error(chalk.red('❌ You must be in a monorepo directory to run this command: cannot find package.json'))
  process.exit(1)
}
const workspacePath = path.join(cmdDir, 'pnpm-workspace.yaml')
if (!fs.existsSync(workspacePath)) {
  console.error(chalk.red('❌ You must be in a monorepo directory to run this command: cannot find pnpm-workspace.yaml'))
  process.exit(1)
}

// Read the meta catalog version
const metaPackagePath = path.resolve(__dirname, '..', 'package.json')
if (!fs.existsSync(metaPackagePath)) {
  console.error(chalk.red('❌ Failed to read meta package.json file: file not found'))
  process.exit(1)
}
let metaPackageContent
try {
  metaPackageContent = JSON.parse(fs.readFileSync(metaPackagePath))
} catch (error) {
  console.error(chalk.red('❌ Failed to read meta package.json file:', error))
  process.exit(1)
}

// Read the meta catalog file
const metacatalogPath = path.resolve(__dirname, '..', 'catalog.json')
if (!fs.existsSync(metacatalogPath)) {
  console.error(chalk.red('❌ Failed to read meta catalog.json file: file not found'))
  process.exit(1)
}
let metaCatalogContent
try {
  metaCatalogContent = JSON.parse(fs.readFileSync(metacatalogPath))
} catch (error) {
  console.error(chalk.red('❌ Failed to read meta catalog.json file:', error))
  process.exit(1)
}

// Read the local catalog file
const localCatalogPath = path.join(cmdDir, 'catalog.json')
let localCatalogContent = {}
if (fs.existsSync(localCatalogPath)) {
  try {
    localCatalogContent = JSON.parse(fs.readFileSync(localCatalogPath))
  } catch (error) {
    console.error(chalk.red('❌ Failed to read local catalog file:', error))
    process.exit(1)
  }
}

// Merge catalogs and sort the global catalog
const mergedCatalogContent = { ...metaCatalogContent, ...localCatalogContent }
const sortedCatalogContent = Object.keys(mergedCatalogContent)
  .sort()
  .reduce((acc, key) => {
    acc[key] = mergedCatalogContent[key]
    return acc
  }, {})

// Read the pnpm-workspace.yaml file
let workspaceContent
try {
  workspaceContent = parse(fs.readFileSync(workspacePath, 'utf8'))
} catch (error) {
  console.error(chalk.red('❌ Failed to read pnpm-workspace.yaml file:', error))
  process.exit(1)
}

// Assign the global catalog to the workspace
workspaceContent.catalog = sortedCatalogContent
fs.writeFileSync(workspacePath, stringify(workspaceContent), 'utf8')

// Updated the package.json file
let packageContent
try {
  packageContent = parse(fs.readFileSync(packagePath, 'utf8'))
} catch (error) {
  console.error(chalk.red('❌ Failed to read package.json file:', error))
  process.exit(1)
}
packageContent.metaCatalog = {
  version: metaPackageContent.version,
  syncedAt: new Date().toISOString()
}
fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2), 'utf8')

console.log(chalk.green('✅ catalog synchronized successfully!'))

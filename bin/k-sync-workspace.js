#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { load, dump } from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cmdDir = path.resolve(process.cwd())

// Settings that are never synchronized because they are specific to each repository
const excludedSettings = ['packages']

// Read a YAML file, an empty file gives an empty object
const readYaml = (filePath) => load(fs.readFileSync(filePath, 'utf8')) ?? {}

// Ensure the command is run within a repo
const packagePath = path.join(cmdDir, 'package.json')
if (!fs.existsSync(packagePath)) {
  console.error(chalk.red('❌ You must be in a node repository to run this command: cannot find package.json'))
  process.exit(1)
}

const workspacePath = path.join(cmdDir, 'pnpm-workspace.yaml')
if (!fs.existsSync(workspacePath)) {
  console.error(chalk.red('❌ You must use PNPM package manager to run this command: cannot find pnpm-workspace.yaml'))
  process.exit(1)
}

// Read the meta package version
const metaPackagePath = path.resolve(__dirname, '..', 'package.json')
if (!fs.existsSync(metaPackagePath)) {
  console.error(chalk.red('❌ Failed to read meta package.json file: file not found'))
  process.exit(1)
}

let metaPackageContent
try {
  metaPackageContent = JSON.parse(fs.readFileSync(metaPackagePath, 'utf8'))
} catch (error) {
  console.error(chalk.red('❌ Failed to read meta package.json file:', error))
  process.exit(1)
}

// Read the meta workspace file
const metaWorkspacePath = path.resolve(__dirname, '..', 'workspace.yaml')
if (!fs.existsSync(metaWorkspacePath)) {
  console.error(chalk.red('❌ Failed to read meta workspace.yaml file: file not found'))
  process.exit(1)
}

let metaWorkspaceContent
try {
  metaWorkspaceContent = readYaml(metaWorkspacePath)
} catch (error) {
  console.error(chalk.red('❌ Failed to read meta workspace.yaml file:', error))
  process.exit(1)
}

// Read the local workspace file, used only to adjust the settings defined in the meta workspace
const localWorkspacePath = path.join(cmdDir, 'workspace.yaml')
let localWorkspaceContent = {}

if (fs.existsSync(localWorkspacePath)) {
  try {
    localWorkspaceContent = readYaml(localWorkspacePath)
  } catch (error) {
    console.error(chalk.red('❌ Failed to read local workspace.yaml file:', error))
    process.exit(1)
  }
}

// Merge a single setting: maps are merged (local entries win), lists are unioned,
// anything else is taken from local
const isMap = (value) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value)

function mergeSetting (meta, local) {
  // A setting with a null value is considered as missing
  if (local == null) return meta
  if (meta == null) return local

  if (isMap(meta) && isMap(local)) {
    const merged = { ...meta, ...local }

    return Object.fromEntries(
      Object.keys(merged)
        .sort()
        .map(key => [key, merged[key]])
    )
  }

  if (Array.isArray(meta) && Array.isArray(local)) {
    return [...new Set([...meta, ...local])].sort()
  }

  return local
}

// Read the pnpm-workspace.yaml file
let workspaceContent
try {
  workspaceContent = readYaml(workspacePath)
} catch (error) {
  console.error(chalk.red('❌ Failed to read pnpm-workspace.yaml file:', error))
  process.exit(1)
}

// Keep the initial workspace content to detect changes
const previousWorkspaceContent = JSON.stringify(workspaceContent)

// Only the settings defined in the meta workspace are managed: each one is overwritten
// in pnpm-workspace.yaml by the merge of the meta and local workspace values.
// Any other setting of pnpm-workspace.yaml is left untouched.
const settings = Object.keys(metaWorkspaceContent)
  .filter(setting => !excludedSettings.includes(setting))

for (const setting of settings) {
  workspaceContent[setting] = mergeSetting(
    metaWorkspaceContent[setting],
    localWorkspaceContent[setting]
  )
}

// Check whether the workspace has changed
const workspaceChanged = JSON.stringify(workspaceContent) !== previousWorkspaceContent
if (!workspaceChanged) {
  console.log(chalk.green('✅ Workspace is already up to date!'))
  process.exit(0)
}

// Keep the original files to restore them if the lockfile update fails,
// otherwise a new run would consider the workspace up to date and skip it
const originalWorkspaceFile = fs.readFileSync(workspacePath, 'utf8')
const originalPackageFile = fs.readFileSync(packagePath, 'utf8')

// Update the pnpm-workspace.yaml file
fs.writeFileSync(
  workspacePath,
  dump(workspaceContent, {
    noRefs: true,
    lineWidth: -1
  }),
  'utf8'
)

// Update the package.json file
let packageContent
try {
  packageContent = JSON.parse(originalPackageFile)
} catch (error) {
  console.error(chalk.red('❌ Failed to read package.json file:', error))
  process.exit(1)
}

delete packageContent.metaCatalog // Former name of the metaWorkspace property
packageContent.metaWorkspace = {
  version: metaPackageContent.version,
  syncedAt: new Date().toISOString()
}

fs.writeFileSync(
  packagePath,
  `${JSON.stringify(packageContent, null, 2)}\n`,
  'utf8'
)

// Update the lockfile only: no node_modules and no build scripts.
// --no-frozen-lockfile is required because pnpm freezes the lockfile by default in CI.
console.log(chalk.blue('📦 Updating PNPM lockfile...'))
try {
  execFileSync('pnpm', ['install', '--lockfile-only', '--no-frozen-lockfile'], {
    cwd: cmdDir,
    stdio: 'inherit'
  })
} catch (error) {
  console.error(chalk.red('❌ PNPM install failed, restoring pnpm-workspace.yaml and package.json'))
  fs.writeFileSync(workspacePath, originalWorkspaceFile, 'utf8')
  fs.writeFileSync(packagePath, originalPackageFile, 'utf8')
  process.exit(error.status || 1)
}

console.log(chalk.green('✅ Workspace synchronized successfully!'))

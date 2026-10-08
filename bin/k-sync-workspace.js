#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { loadAll, dump } from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cmdDir = path.resolve(process.cwd())

// Settings that are never synchronized because they are specific to each repository
const excludedSettings = ['packages']

// Read a YAML file, an empty file gives an empty object (loadAll is used because load throws on an empty document)
const readYaml = (filePath) => loadAll(fs.readFileSync(filePath, 'utf8'))[0] ?? {}

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

// Read the local workspace file
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
  // A setting left empty in a file is considered as missing
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

// Replace every managed setting in the workspace.
// Excluded settings and settings unknown to the meta and local files are left untouched.
const settings = [
  ...new Set([
    ...Object.keys(metaWorkspaceContent),
    ...Object.keys(localWorkspaceContent)
  ])
].filter(setting => !excludedSettings.includes(setting))

for (const setting of settings) {
  workspaceContent[setting] = mergeSetting(
    metaWorkspaceContent[setting],
    localWorkspaceContent[setting]
  )
}

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
  packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
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
  JSON.stringify(packageContent, null, 2),
  'utf8'
)

console.log(chalk.green('✅ workspace synchronized successfully!'))

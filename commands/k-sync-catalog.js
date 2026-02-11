#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { parse, stringify } from 'yaml'

const rootDir = path.resolve(process.cwd())

// Read the meta catalog file
let metaCatalog
try {
  metaCatalog = await import('@kalisio/meta-ekosystem/catalog.json', { with: { type: 'json' } })
  metaCatalog = metaCatalog.default ?? metaCatalog
} catch (err) {
  throw new Error('❌ Failed to load the meta catalog.json file from @kalisio/meta-ekosystem')
}

// Read the local catalog file
let localCatalog = {}
const localCatalogPath = path.join(rootDir, 'catalog.json')
if (fs.existsSync(localCatalogPath)) {
  try {
    localCatalog = JSON.parse(fs.readFileSync(localCatalogPath))
  } catch (err) {
    throw new Error('❌ Failed to load the local catalog.json file')
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
const workspacePath = path.join(rootDir, 'pnpm-workspace.yaml')
if (!fs.existsSync(workspacePath)) {
  throw new Error('❌ pnpm-workspace.yaml not found in this repo')
}
let workspace
try {
  workspace = parse(fs.readFileSync('./pnpm-workspace.yaml', 'utf8'))
} catch (err) {
  throw new Error('❌ Failed to load pnpm-workspace.yaml file')
}

// Assign the global catalog to the workspace
workspace.catalog = sortedCatalog
fs.writeFileSync(workspacePath, stringify(workspace), 'utf8')

console.log(`✅ catalog synced in pnpm-workspace.yaml`)

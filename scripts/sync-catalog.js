#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

// Options : support --dry-run
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

// Read the meta catalog file
let metaCatalog
try {
  metaCatalog = await import('@kalisio/meta-ekosystem/catalog.json', { with: { type: 'json' } })
  metaCatalog = metaCatalog.default ?? metaCatalog
} catch (err) {
  throw new Error('❌ Failed to load the meta catalog from @kalisio/meta-ekosystem')
}
// Read the local catalog file
let localCatalog
try {
  localCatalog = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'catalog.json')))
} catch (err) {
  throw new Error('❌ Failed to load the local catalog')
}
// Read the pnpm-workspace.yaml file
const pkgPath = path.resolve(process.cwd(), 'package.json')
if (!fs.existsSync(pkgPath)) {
  throw new Error('❌ pnpm-workspace.yaml not found in this repo')
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
// Merge the catalog
pkg.pnpm ||= {}
pkg.pnpm.catalog ||= {}
const mergedCatalog = { ...metaCatalog, ...localCatalog }
if (dryRun) {
  console.log('🔹 Dry run mode, merged catalog would be:')
  console.log(JSON.stringify(mergedCatalog, null, 2))
} else {
  pkg.pnpm.catalog = mergedCatalog
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  console.log('✅ pnpm.catalog synced from meta-ekosystem')
}

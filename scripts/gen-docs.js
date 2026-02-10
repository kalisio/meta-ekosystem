#!/usr/bin/env node
import jsdoc2md from 'jsdoc-to-markdown'
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

const rootDir = path.resolve(process.cwd())
const templatesDir = path.join(rootDir, 'templates', 'jsdoc2md')

const packageDirs = await glob('packages/*/', { cwd: rootDir })
const packages = packageDirs.map(dir => path.basename(dir))

console.log(`📦 Found ${packages.length} package(s): ${packages.join(', ')}\n`)

for (const pkgName of packages) {
  console.log(`📝 Generating docs for @kalisio/${pkgName}...`)

  const pkgDir = path.join(rootDir, 'packages', pkgName)
  const docsDir = path.join(rootDir, 'docs', pkgName)

  const sourceFiles = await glob('src/**/*.js', {
    cwd: pkgDir,
    ignore: ['**/*.test.js', '**/*.spec.js']
  })

  if (sourceFiles.length === 0) {
    console.log('  ⚠️  No source files found\n')
    continue
  }

  console.log(`  Found ${sourceFiles.length} file(s)`)

  for (const relativeFile of sourceFiles) {
    const sourceFile = path.join(pkgDir, relativeFile)
    const relativePath = relativeFile.replace(/^src\//, '').replace(/\.js$/, '.md')
    const outputFile = path.join(docsDir, relativePath)

    try {
      const markdown = await jsdoc2md.render({
        files: sourceFile,
        'no-cache': true,
        template: fs.readFileSync(path.join(templatesDir, 'jsdoc2md.hbs'), 'utf8')
      })

      if (markdown.trim()) {
        fs.mkdirSync(path.dirname(outputFile), { recursive: true })

        const moduleName = path.basename(relativeFile, '.js')
        const content = `---
title: ${moduleName}
---

# ${moduleName}

${markdown}
`

        fs.writeFileSync(outputFile, content)
        console.log(`  ✅ ${relativePath}`)
      } else {
        console.log(`  ⏭️  ${relativeFile} (no JSDoc)`)
      }
    } catch (error) {
      console.error(`  ❌ ${relativeFile}: ${error.message}`)
    }
  }

  console.log('')
}

console.log('✅ Documentation generation complete!')

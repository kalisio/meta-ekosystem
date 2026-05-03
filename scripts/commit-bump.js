// scripts/commit-bump.js
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

execSync('git add .')
execSync(`git commit -m "chore: release v${version}"`)
execSync('git push')

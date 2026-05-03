const { execSync } = require('child_process')
const { version } = require('../package.json')

execSync('git add .')
execSync(`git commit -m "chore: bump to v${version}"`)
execSync('git push')

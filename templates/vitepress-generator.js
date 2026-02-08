import path from 'path'
import fs from 'fs'

export default function vitepressGenerator(plop) {

  // Helper to retrieve the list of pakages
  plop.setHelper('internalPackages', function(targetPath) {
    const packagesDir = path.join(targetPath, 'packages')
    if (!fs.existsSync(packagesDir)) return ''
    const packages = fs.readdirSync(packagesDir).filter(name => {
      const pjson = path.join(packagesDir, name, 'package.json')
      return fs.existsSync(pjson)
    })
    return packages.join('\n- ')
  })

  plop.setGenerator('vitepress', {
    description: 'Generate VitePress docs for a repo',
    prompts: [
      {
        type: 'input',
        name: 'targetPath',
        message: 'Enter the path to the repo where docs should be created:',
        default: process.cwd()
      }
    ],
    actions: function(answers) {
      const targetRepo = path.resolve(answers.targetPath)
      const pkgPath = path.join(targetRepo, 'package.json')
      if (!fs.existsSync(pkgPath)) {
        throw new Error(`❌ No package.json found in ${targetRepo}. Aborting.`)
      }
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
      // Inject required variables
      const vars = {
        name: pkg.name,
        description: pkg.description || '',
        version: pkg.version || '0.0.1',
        targetPath
      }
      // Tell plop to do the process
      return [
        {
          type: 'addMany',
          destination: path.join(targetRepo, 'docs'),
          base: path.resolve('./templates/vitepress'),
          templateFiles: path.resolve('./templates/vitepress/**'),
          data: vars,
          abortOnFail: true
        }
      ]
    }
  })
}

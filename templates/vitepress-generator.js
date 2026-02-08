import path from 'path'
import fs from 'fs'

export default function vitepressGenerator(plop) {
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
      // Read the package.json file
      const packageJsonPath = path.join(targetRepo, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`❌ No package.json found in ${targetRepo}. Aborting.`)
      }
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      // Define the list of packages
      let internalPackages = []
      const packagesDir = path.join(targetRepo, 'packages')
      if (fs.existsSync(packagesDir)) {
        internalPackages = fs.readdirSync(packagesDir).filter(name => {
          const pjson = path.join(packagesDir, name, 'package.json')
          return fs.existsSync(pjson)
        })
      }
      // Tell plop to do the process
      return [
        {
          type: 'addMany',
          destination: path.join(targetRepo, 'docs'),
          base: path.resolve('./templates/vitepress'),
          templateFiles: path.resolve('./templates/vitepress/**/*'),
          globOptions: { dot: true },
          data: {
            name: packageJson.name,
            description: packageJson.description,
            version: packageJson.version,
            internalPackages,
            targetPath: answers.targetPath
          },
          abortOnFail: true
        }
      ]
    }
  })
}

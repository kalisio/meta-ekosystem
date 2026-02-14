import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function vitepressGenerator (plop) {
  plop.setGenerator('vitepress', {
    description: 'Generate a VitePress docummentation skeleton',
    prompts: [],
    actions: function (answers) {
      const targetRepo = path.resolve(process.cwd())
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
      const templatesPath = path.resolve(__dirname, 'vitepress')
      return [
        {
          type: 'addMany',
          destination: path.join(targetRepo, 'docs'),
          base: templatesPath,
          templateFiles: path.join(templatesPath, '**/*'),
          globOptions: {
            dot: true
          },
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

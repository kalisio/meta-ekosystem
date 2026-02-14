import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function packageGenerator (plop) {
  plop.setGenerator('package', {
    description: 'Generate a package skeleton in a monorepo',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Package name:'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Package description'
      }
    ],
    actions: function (answers) {
      const monorepoDir = path.resolve(process.cwd())
      // Read the package.json file
      const monorepoPkgPath = path.join(monorepoDir, 'package.json')
      if (!fs.existsSync(monorepoPkgPath)) {
        throw new Error(`❌ No package.json found in ${monorepoDir}. Aborting.`)
      }
      // Defne the requested variables
      const monorepoPkg = JSON.parse(fs.readFileSync(monorepoPkgPath, 'utf-8'))
      const monorepoName = monorepoPkg.name
      const packageName = answers.name
      const packageDir = path.join(monorepoDir, 'packages', packageName)
      const templatesDir = path.join(__dirname, 'package')
      return [
        {
          type: 'addMany',
          destination: packageDir,
          base: templatesDir,
          templateFiles: path.join(templatesDir, '**/*'),
          globOptions: {
            dot: true
          },
          data: {
            name: packageName,
            monorepo: monorepoName
          }
        }
      ]
    }
  })
}

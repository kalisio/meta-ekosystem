import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function packageGenerator (plop) {
  plop.setGenerator('application', {
    description: 'Generate an application skeleton in a monorepo',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Application name:'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Application description'
      }
    ],
    actions: function (answers) {
      const monorepoDir = path.resolve(process.cwd())
      // Read the package.json file
      const monorepoPkgPath = path.join(monorepoDir, 'package.json')
      if (!fs.existsSync(monorepoPkgPath)) {
        throw new Error(`❌ No package.json found in ${monorepoDir}. Aborting.`)
      }
      // Define the requested variables
      const monorepoPkg = JSON.parse(fs.readFileSync(monorepoPkgPath, 'utf-8'))
      const monorepoName = monorepoPkg.name
      const packageName = answers.name
      const packageDir = path.join(monorepoDir, 'packages', packageName)
      const templatesDir = path.join(__dirname, 'application')
      return [
        {
          type: 'addMany',
          destination: `${packageDir}-common`,
          base: templatesDir,
          templateFiles: path.join(templatesDir, 'common', '**/*'),
          globOptions: {
            dot: true
          },
          data: {
            name: packageName,
            monorepo: monorepoName
          }
        },
        {
          type: 'addMany',
          destination: `${packageDir}-api`,
          base: templatesDir,
          templateFiles: path.join(templatesDir, 'api', '**/*'),
          globOptions: {
            dot: true
          },
          data: {
            name: packageName,
            monorepo: monorepoName
          }
        },
        {
          type: 'addMany',
          destination: `${packageDir}-ui`,
          base: templatesDir,
          templateFiles: path.join(templatesDir, 'ui', '**/*'),
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

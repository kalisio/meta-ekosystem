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
      const packageDir = path.join(monorepoDir, 'packages', answers.name)
      const templatesDir = path.join(__dirname, 'application')
      const monorepoUrl = monorepoPkg.repository?.url
        ?.replace(/^git\+/, '')
        ?.replace(/\/[^/]+\.git$/, '')
      const author = typeof monorepoPkg.author === 'object' ? monorepoPkg.author : {}
      const hasLicense = Boolean(monorepoPkg.license) && monorepoPkg.license !== 'UNLICENSED'
      const docsDir = path.join(monorepoDir, 'docs')
      const hasDocs = fs.existsSync(docsDir)
      const templateData = {
        name: answers.name,
        description: answers.description,
        monorepoName,
        monorepoUrl,
        packageManager: monorepoPkg.packageManager,
        author,
        license: hasLicense,
        documentation: hasDocs,
        year: new Date().getFullYear()
      }

      function actionFor (sub) {
        const base = path.join(templatesDir, sub)
        return {
          type: 'addMany',
          destination: `${packageDir}-${sub}`,
          base,
          templateFiles: path.join(base, '**/*'),
          globOptions: {
            dot: true,
            ignore: hasLicense ? [] : [path.join(base, 'LICENSE.md')]
          },
          data: templateData
        }
      }
      return [actionFor('common'), actionFor('api'), actionFor('ui')]
    }
  })
}

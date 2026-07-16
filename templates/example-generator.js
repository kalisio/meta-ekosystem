import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function packageGenerator (plop) {
  plop.setGenerator('example', {
    description: 'Generate an example skeleton in a monorepo',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Example name:'
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
      const examplesDir = path.join(monorepoDir, 'examples', answers.name)
      const templatesDir = path.join(__dirname, 'example')
      const author = typeof monorepoPkg.author === 'object' ? monorepoPkg.author : {}
      const hasLicense = Boolean(monorepoPkg.license) && monorepoPkg.license !== 'UNLICENSED'
      const ignore = []
      if (!hasLicense) ignore.push(path.join(templatesDir, 'LICENSE.md'))
      return [
        {
          type: 'addMany',
          destination: examplesDir,
          base: templatesDir,
          templateFiles: path.join(templatesDir, '**/*'),
          globOptions: {
            dot: true,
            ignore
          },
          data: {
            packageManager: monorepoPkg.packageManager,
            authorName: author.name,
            authorEmail: author.email,
            authorUrl: author.url,
            authorLogo: author.logo,
            license: hasLicense
          }
        }
      ]
    }
  })
}

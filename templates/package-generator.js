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
        type: 'list',
        name: 'type',
        message: 'Package type:',
        choices: ['library', 'job', 'service']
      },
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
      // Define the requested variables
      const monorepoPkg = JSON.parse(fs.readFileSync(monorepoPkgPath, 'utf-8'))
      const monorepoName = monorepoPkg.name
      const packageName = answers.name
      const contentPackageDir = path.join(monorepoDir, 'packages', packageName)
      const docsDir = path.join(monorepoDir, 'docs')
      const docsPackageDir = path.join(docsDir, 'packages', packageName)
      const templatesDir = path.join(__dirname, 'package', answers.type)
      const templateData = {
        name: packageName,
        description: answers.description,
        monorepo: monorepoName
      }

      const actions = [
        {
          type: 'addMany',
          destination: contentPackageDir,
          base: path.join(templatesDir, 'content'),
          templateFiles: '**/*',
          globOptions: {
            dot: true
          },
          data: templateData
        },
        {
          type: 'addMany',
          destination: docsPackageDir,
          base: path.join(templatesDir, 'docs'),
          templateFiles: '**/*',
          globOptions: {
            dot: true
          },
          data: templateData
        }
      ]

      if (answers.type === 'library') {
        actions.push(function addPackageScripts (answers) {
          const pkg = JSON.parse(fs.readFileSync(monorepoPkgPath, 'utf-8'))
          pkg.scripts[`build:${answers.name}`] = `pnpm --filter @kalisio/${answers.name} build`
          pkg.scripts[`lint:${answers.name}`] = `pnpm --filter @kalisio/${answers.name} lint`
          pkg.scripts[`test:${answers.name}`] = `pnpm --filter @kalisio/${answers.name} test`
          pkg.scripts = Object.fromEntries(
            Object.entries(pkg.scripts).sort(([a], [b]) => a.localeCompare(b))
          )
          fs.writeFileSync(monorepoPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
          return `✅ Scripts "build:${answers.name}", "lint:${answers.name}" and "test:${answers.name}" added in package.json`
        })
      }

      if (answers.type === 'service') {
        actions.push(function addPackageScripts (answers) {
          const pkg = JSON.parse(fs.readFileSync(monorepoPkgPath, 'utf-8'))
          pkg.scripts[`lint:${answers.name}`] = `pnpm --filter @kalisio/${answers.name} lint`
          pkg.scripts[`test:${answers.name}`] = `pnpm --filter @kalisio/${answers.name} test`
          pkg.scripts = Object.fromEntries(
            Object.entries(pkg.scripts).sort(([a], [b]) => a.localeCompare(b))
          )
          fs.writeFileSync(monorepoPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
          return `✅ Scripts "lint:${answers.name}" and "test:${answers.name}" added in package.json`
        })
      }

      actions.push({
        type: 'modify',
        path: path.join(docsDir, '.vitepress', 'packages.json'),
        transform: (fileContent, answers) => {
          const packages = JSON.parse(fileContent)
          if (!packages.includes(answers.name)) {
            packages.push(answers.name)
          }
          return JSON.stringify(packages, null, 2)
        }
      })

      return actions
    }
  })
}

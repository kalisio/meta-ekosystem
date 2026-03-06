import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function vitepressGenerator (plop) {
  plop.setGenerator('vitepress', {
    description: 'Generate a VitePress docummentation skeleton',
    prompts: [
      {
        type: 'input',
        name: 'roadmapUrl',
        message: 'Roadmap url:'
      }
    ],
    actions: function (answers) {
      const monorepoDir = path.resolve(process.cwd())
      // Read the package.json file
      const monorepoPkgPath = path.join(monorepoDir, 'package.json')
      if (!fs.existsSync(monorepoPkgPath)) {
        throw new Error(`❌ No package.json found in ${monorepoDir}. Aborting.`)
      }
      const packageJson = JSON.parse(fs.readFileSync(monorepoPkgPath, 'utf-8'))
      // Define the list of packages
      let internalPackages = []
      const packagesDir = path.join(monorepoDir, 'packages')
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
          destination: path.join(monorepoDir, 'docs'),
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
            roadmapUrl: answers.roadmapUrl
          },
          abortOnFail: true
        },
        function addPackageScripts () {
          const pkg = JSON.parse(fs.readFileSync(monorepoPkgPath, 'utf-8'))
          pkg.scripts['docs:dev'] = 'vitepress dev docs'
          pkg.scripts['docs:build'] = 'vitepress build docs'
          pkg.scripts = Object.fromEntries(
            Object.entries(pkg.scripts).sort(([a], [b]) => a.localeCompare(b))
          )
          fs.writeFileSync(monorepoPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
          return '✅ Scripts "docs:dev" and "docs:build" added in package.json'
        }
      ]
    }
  })
}

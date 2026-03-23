import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse, stringify } from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function monorepoGenerator (plop) {
  plop.setActionType('injectCatalog', (answers, config) => {
    const catalogPath = path.resolve(__dirname, '../catalog.json')
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))
    const workspacePath = path.resolve(config.destination, 'pnpm-workspace.yaml')
    const existing = parse(fs.readFileSync(workspacePath, 'utf-8'))
    const updated = {
      ...existing,
      catalog: {
        ...(existing.catalog ?? {}),
        ...catalog
      }
    }
    fs.writeFileSync(workspacePath, stringify(updated))
    return '✅ pnpm-workspace.yaml synchronized'
  })

  plop.setGenerator('monorepo', {
    description: 'Generate a monorepo skeleton',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Repository name:'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Repository description:'
      },
      {
        type: 'input',
        name: 'roadmapUrl',
        message: 'Roadmap url:'
      },
      {
        type: 'input',
        name: 'path',
        message: 'Repository path:',
        default: '..'
      }
    ],
    actions: function (answers) {
      const targetRepo = path.resolve(process.cwd(), answers.path, answers.name)
      const templatesPath = path.resolve(__dirname, 'monorepo')
      return [
        {
          type: 'addMany',
          destination: targetRepo,
          base: templatesPath,
          templateFiles: path.join(templatesPath, '**/*'),
          globOptions: {
            dot: true
          },
          data: {
            name: answers.name,
            description: answers.description,
            roadmapUrl: answers.roadmapUrl
          }
        },
        {
          type: 'injectCatalog',
          destination: targetRepo
        }
      ]
    }
  })
}

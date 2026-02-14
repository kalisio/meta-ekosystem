import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function monorepoGenerator (plop) {
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
            name: answers.name
          }
        }
      ]
    }
  })
}

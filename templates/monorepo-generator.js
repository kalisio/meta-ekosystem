import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function monorepoGenerator (plop) {
  plop.setGenerator('monorepo', {
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Name of the repository:'
      },
      {
        type: 'input',
        name: 'path',
        message: 'Path to the new repositoty:',
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

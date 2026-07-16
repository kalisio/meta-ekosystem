import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default function monorepoGenerator (plop) {
  plop.setActionType('injectCatalog', (answers, config) => {
    execSync('k-sync-catalog', { cwd: config.destination, stdio: 'inherit' })
    return 'catalog synced'
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
        name: 'repoUrl',
        message: 'Repository url:',
        default: 'https://github.com/kalisio'
      },
      {
        type: 'input',
        name: 'authorName',
        message: 'Author name:',
        default: 'KALISIO'
      },
      {
        type: 'input',
        name: 'authorEmail',
        message: 'Author email:',
        default: 'contact@kalisio.com'
      },
      {
        type: 'input',
        name: 'authorUrl',
        message: 'Author url:',
        default: 'https://kalisio.com'
      },
      {
        type: 'input',
        name: 'authorLogo',
        message: 'Author logo url:',
        default: 'https://kalisio.github.io/kalisioscope/kalisio/kalisio-logo-light-256x96.png'
      },
      {
        type: 'input',
        name: 'sonarUrl',
        message: 'SonarQube url:',
        default: 'https://sonar.portal.kalisio.com'
      },
      {
        type: 'input',
        name: 'sonarPrefix',
        message: 'SonarQube project prefix:',
        default: 'kalisio-'
      },
      {
        type: 'input',
        name: 'sonarToken',
        message: 'SonarQube project token:',
        default: 'sqp-XXXXXXXXXXXXXXXXXX'
      },
      {
        type: 'confirm',
        name: 'documentation',
        message: 'Include Documentation section?',
        default: true
      },
      {
        type: 'input',
        name: 'docsUrl',
        message: 'Documentation url:',
        when: (answers) => answers.documentation
      },
      {
        type: 'input',
        name: 'roadmapUrl',
        message: 'Roadmap url:',
        when: (answers) => answers.documentation
      },
      {
        type: 'confirm',
        name: 'license',
        message: 'Include License section?',
        default: true
      },
      {
        type: 'input',
        name: 'path',
        message: 'Repository path:',
        default: (answers) => `./${answers.name}`
      }
    ],
    actions: function (answers) {
      const targetRepo = path.resolve(process.cwd(), answers.path)
      const templatesPath = path.resolve(__dirname, 'monorepo')
      const ignore = []
      if (!answers.documentation) ignore.push(path.join(templatesPath, 'docs/**'))
      if (!answers.license) {
        ignore.push(path.join(templatesPath, 'LICENSE.md'))
        ignore.push(path.join(templatesPath, 'docs/licence.md'))
      }
      return [
        {
          type: 'addMany',
          destination: targetRepo,
          base: templatesPath,
          templateFiles: path.join(templatesPath, '**/*'),
          globOptions: {
            dot: true,
            ignore
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

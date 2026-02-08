import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// importer le générateur qui est au même niveau que le répertoire vitepress
const vitepressGeneratorPath = path.resolve(__dirname, './templates/vitepress-generator.js')
const { default: vitepressGenerator } = await import(vitepressGeneratorPath)

export default function (plop) {
  vitepressGenerator(plop)
}

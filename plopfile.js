import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import monorepo generator
const monorepoGeneratorPath = path.resolve(__dirname, './templates/monorepo-generator.js')
const { default: monorepoGenerator } = await import(monorepoGeneratorPath)

// Import vitepress generator
const vitepressGeneratorPath = path.resolve(__dirname, './templates/vitepress-generator.js')
const { default: vitepressGenerator } = await import(vitepressGeneratorPath)

export default function (plop) {
  monorepoGenerator(plop),
  vitepressGenerator(plop)
}

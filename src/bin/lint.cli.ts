// cSpell:disable

import fs from 'node:fs'
import path from 'node:path'
import { rules } from './lint.rules.ts'

const legacyMarker = '// @ts-nocheck'
const __dirname = import.meta.dirname
const srcDir = path.resolve(__dirname, '..')

function lintFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8')
  if (content.includes(legacyMarker)) return []
  const issues: string[] = []
  for (const rule of rules)
    if (!rule.check(content, filePath)) {
      const errorMessage = typeof rule.error === 'function' ? rule.error(content) : rule.error
      issues.push(errorMessage)
    }

  return issues
}

function main() {
  const files = fs
    .readdirSync(srcDir)
    .filter(fileName => fileName.endsWith('.user.js'))
    .map(fileName => path.join(srcDir, fileName))
  let foundIssues = false
  for (const filePath of files) {
    const issues = lintFile(filePath)
    for (const issue of issues) {
      console.error(`File: ${filePath} - Issue: ${issue}`)
      foundIssues = true
    }
  }
  if (foundIssues) throw new Error('Lint issues found.')
  console.log('All user-scripts passed guideline linting.')
}

main()

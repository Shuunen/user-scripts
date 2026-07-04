// cSpell:disable
import path from 'node:path'

export type Rule = {
  check: (content: string, filePath?: string) => boolean
  error: string | ((content: string) => string)
  name: string
}

const regexUserScriptName = /^\/\/ ==UserScript==\n\/\/ @name/m
const regexDownloadUrl = /@downloadURL\s+https:\/\/github.com\/Shuunen\/user-scripts\/raw\/master\/src\/.+\.user\.js/
const regexUpdateUrl = /@updateURL\s+https:\/\/github.com\/Shuunen\/user-scripts\/raw\/master\/src\/.+\.user\.js/
const regexMatchDomain = /\*\.[^\s]+\.com/
const regexIcon = /@icon\s+https:\/\/www\.google\.com\/s2\/favicons\?sz=64&domain=[^\s]+/
const regexMainFuncKebab = /-(?<letter>[a-z])/g
const regexMainFuncPascal = /^(?<firstTwo>..)/
const regexMainFuncDef = (name: string) => new RegExp(`function ${name}\\(`)
const regexExportPattern1 = /if \(globalThis\.window\) (?:void )?[A-Z][A-Za-z0-9_]*\(\)/
const regexExportPattern2 = /if \(globalThis\.window\) (?:void )?[A-Z][A-Za-z0-9_]*\(\)\nelse module\.exports = \{.*\}/s
const regexIife = /\(function [A-Z][A-Za-z0-9_]*\(\) \{[\s\S]*\}\)\(\);/
const regexFunctionDef = /function (?<name>[a-z][A-Za-z0-9_]*)\(/g
const regexMainFunctionDef = /function (?<name>[A-Z][A-Za-z0-9_]*)\(/
const regexModuleExports = /module\.exports = \{(?<content>[^}]*)\}/s

function findFunctionStart(content: string, mainName: string): number {
  return content.indexOf(`function ${mainName}(`)
}

function findBracePositions(content: string, startIndex: number): { end: number; start: number } {
  let braceCount = 0
  let bodyStart = -1
  let bodyEnd = -1
  for (let index = startIndex; index < content.length; index += 1) {
    const char = content[index]
    if (char === '{' && braceCount === 0) bodyStart = index
    if (char === '{') braceCount += 1
    if (char === '}') braceCount -= 1
    if (char === '}' && braceCount === 0) {
      bodyEnd = index
      break
    }
  }
  return { end: bodyEnd, start: bodyStart }
}

function findMainFunctionBoundaries(content: string, mainName: string): { end: number; start: number } {
  const mainFuncStart = findFunctionStart(content, mainName)
  if (mainFuncStart === -1) return { end: -1, start: -1 }
  return findBracePositions(content, mainFuncStart)
}

function extractFunctionNames(content: string, mainName: string, boundaries: { end: number; start: number }): string[] {
  const outsideFunctions: string[] = []
  let match: RegExpExecArray | null = regexFunctionDef.exec(content)
  while (match) {
    const functionName = match.at(1) ?? ''
    const functionIndex = match.index
    const isNotMainFunction = functionName !== mainName
    const isOutsideMainFunction = functionIndex < boundaries.start || functionIndex > boundaries.end
    if (isNotMainFunction && isOutsideMainFunction) outsideFunctions.push(functionName)
    match = regexFunctionDef.exec(content)
  }
  return outsideFunctions
}

function getOutsideFunctions(content: string): string[] {
  regexFunctionDef.lastIndex = 0
  regexMainFunctionDef.lastIndex = 0
  const mainMatch = regexMainFunctionDef.exec(content)
  if (!mainMatch) return []
  const mainName = mainMatch.at(1) ?? ''
  const boundaries = findMainFunctionBoundaries(content, mainName)
  if (boundaries.start === -1) return []
  return extractFunctionNames(content, mainName, boundaries)
}

export const rules: Rule[] = [
  {
    check: (content: string) => regexUserScriptName.test(content),
    error: 'missing or misplaced @name meta (should be second line)',
    name: '@name second line',
  },
  {
    check: (content: string) => regexDownloadUrl.test(content) && regexUpdateUrl.test(content),
    error: 'missing or incorrect @downloadURL/@updateURL (expected https://github.com/Shuunen/user-scripts/raw/master/src/)',
    name: '@downloadURL/@updateURL',
  },
  {
    check: (content: string) => !regexMatchDomain.test(content),
    error: 'wildcard in @match domain is not allowed',
    name: '@match domain',
  },
  {
    check: (content: string) => regexIcon.test(content),
    error: 'missing or incorrect @icon meta',
    name: '@icon domain',
  },
  {
    check: (content: string, filePath?: string) => {
      if (filePath === undefined) return false
      const baseName = path.basename(filePath, '.user.js')
      const expectedName = baseName.replace(regexMainFuncKebab, (_substr, character: string) => character.toUpperCase()).replace(regexMainFuncPascal, matchGroup => matchGroup[0].toUpperCase() + matchGroup[1])
      return regexMainFuncDef(expectedName).test(content)
    },
    error: 'main function name does not match filename (PascalCase)',
    name: 'main function name',
  },
  {
    check: (content: string) => regexExportPattern1.test(content) || regexExportPattern2.test(content),
    error: 'missing or incorrect export pattern',
    name: 'export pattern',
  },
  {
    check: (content: string) => !regexIife.test(content),
    error: 'IIFE pattern is not allowed',
    name: 'no IIFE',
  },
  {
    check: (content: string) => !content.includes('githubusercontent'),
    error: 'githubusercontent URLs are not allowed, migrate to https://www.jsdelivr.com/github',
    name: 'no githubusercontent',
  },
  {
    check: (content: string) => {
      const outsideFunctions = getOutsideFunctions(content)
      if (outsideFunctions.length === 0) return true
      const exportsMatch = regexModuleExports.exec(content)
      if (!exportsMatch) return false
      const exported = exportsMatch.at(1) ?? ''
      return outsideFunctions.every(fn => exported.includes(fn))
    },
    error: (content: string) => {
      const outsideFunctions = getOutsideFunctions(content)
      if (outsideFunctions.length === 0) return 'camelCase functions outside main PascalCase function must be exported via module.exports'
      const exportsMatch = regexModuleExports.exec(content)
      if (!exportsMatch) return `camelCase functions outside main PascalCase function must be exported via module.exports. Missing functions: ${outsideFunctions.join(', ')}`
      const exported = exportsMatch.at(1) ?? ''
      const missingFunctions = outsideFunctions.filter(fn => !exported.includes(fn))
      if (missingFunctions.length === 0) return 'camelCase functions outside main PascalCase function must be exported via module.exports'
      return `camelCase functions outside main PascalCase function must be exported via module.exports. Missing functions: ${missingFunctions.join(', ')}`
    },
    name: 'outside function export',
  },
]

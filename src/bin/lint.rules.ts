// cSpell:disable
import path from 'node:path'

export type Rule = {
  check: (content: string, filePath?: string) => boolean
  error: string | ((content: string, filePath?: string) => string)
  name: string
}

const regexUserScriptName = /^\/\/ ==UserScript==\n\/\/ @name/m
const selfRawUrl = 'https://github.com/Shuunen/user-scripts/raw/master/src/'
const regexDownloadUrl = /^\/\/ @downloadURL\s+(?<url>\S+)/m
const regexUpdateUrl = /^\/\/ @updateURL\s+(?<url>\S+)/m
const scriptAuthor = 'Romain Racamier-Lafon'
const regexAuthor = new RegExp(`^// @author\\s+${scriptAuthor}\\s*$`, 'm')
const regexNamespace = /^\/\/ @namespace\s+https:\/\/github\.com\/Shuunen\s*$/m
const regexVersion = /^\/\/ @version\s+\d+\.\d+\.\d+\s*$/m
const regexMetaBlock = /\/\/ ==UserScript==\n(?<meta>[\s\S]*?)\/\/ ==\/UserScript==/
const regexMetaKey = /^\/\/ @(?<key>[a-zA-Z-]+)/gm
const metaKeyOrder = ['name', 'author', 'description', 'downloadURL', 'updateURL', 'grant', 'match', 'icon', 'namespace', 'require', 'version']
const regexMatchDomain = /\*\.[^\s]+\.com/
const regexMatchAny = /^\/\/ @(?:match|include)[ \t]+\S+/m
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
const regexSelfRequire = /@require\s+https:\/\/cdn\.jsdelivr\.net\/gh\/Shuunen\/user-scripts(?<ref>@[^/\s]+)?\//g
const selfRequireRef = '@master'

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

function getExpectedSelfUrl(filePath?: string): string {
  if (filePath === undefined) return ''
  return `${selfRawUrl}${path.basename(filePath)}`
}

function getMetaKeys(content: string): string[] {
  const block = regexMetaBlock.exec(content)?.at(1) ?? ''
  regexMetaKey.lastIndex = 0
  const keys: string[] = []
  let match: RegExpExecArray | null = regexMetaKey.exec(block)
  while (match) {
    const key = match.at(1) ?? ''
    if (metaKeyOrder.includes(key) && !keys.includes(key)) keys.push(key)
    match = regexMetaKey.exec(block)
  }
  return keys
}

function getMetaKeysOutOfOrder(content: string): string[] {
  const keys = getMetaKeys(content)
  const sorted = [...keys].toSorted((keyA, keyB) => metaKeyOrder.indexOf(keyA) - metaKeyOrder.indexOf(keyB))
  return keys.filter((key, index) => key !== sorted[index])
}

function getWrongSelfRequires(content: string): string[] {
  regexSelfRequire.lastIndex = 0
  const wrongRefs: string[] = []
  let match: RegExpExecArray | null = regexSelfRequire.exec(content)
  while (match) {
    const ref = match.at(1) ?? ''
    if (ref !== selfRequireRef) wrongRefs.push(ref === '' ? '(no ref)' : ref)
    match = regexSelfRequire.exec(content)
  }
  return wrongRefs
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

export const metadataRules: Rule[] = [
  {
    check: (content: string) => regexUserScriptName.test(content),
    error: 'missing or misplaced @name meta (should be second line)',
    name: '@name second line',
  },
  {
    check: (content: string, filePath?: string) => {
      const expected = getExpectedSelfUrl(filePath)
      if (expected === '') return false
      return regexDownloadUrl.exec(content)?.at(1) === expected && regexUpdateUrl.exec(content)?.at(1) === expected
    },
    error: (_content: string, filePath?: string) => `@downloadURL and @updateURL must both be exactly "${getExpectedSelfUrl(filePath)}"`,
    name: '@downloadURL/@updateURL',
  },
  {
    check: (content: string) => regexAuthor.test(content),
    error: `missing or incorrect @author, expected "${scriptAuthor}"`,
    name: '@author',
  },
  {
    check: (content: string) => regexNamespace.test(content),
    error: 'missing or incorrect @namespace, expected "https://github.com/Shuunen"',
    name: '@namespace',
  },
  {
    check: (content: string) => regexVersion.test(content),
    error: 'missing or non-semver @version, expected something like "1.0.0"',
    name: '@version semver',
  },
  {
    check: (content: string) => getMetaKeysOutOfOrder(content).length === 0,
    error: (content: string) => `metadata keys are out of order (${getMetaKeysOutOfOrder(content).join(', ')}), expected order : ${metaKeyOrder.join(', ')}`,
    name: 'metadata key order',
  },
  {
    check: (content: string) => regexMatchAny.test(content),
    error: 'missing @match, without it the script never runs, use "*://*/*" to run everywhere',
    name: '@match presence',
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
    check: (content: string) => !content.includes('githubusercontent'),
    error: 'githubusercontent URLs are not allowed, migrate to https://www.jsdelivr.com/github',
    name: 'no githubusercontent',
  },
  {
    check: (content: string) => !content.includes('Shuunen/monorepo'),
    error: `Shuunen/monorepo does not exist anymore, use https://cdn.jsdelivr.net/gh/Shuunen/user-scripts${selfRequireRef}/src/`,
    name: 'no monorepo url',
  },
  {
    check: (content: string) => getWrongSelfRequires(content).length === 0,
    error: (content: string) => `@require to user-scripts must use the "${selfRequireRef}" ref, found : ${getWrongSelfRequires(content).join(', ')} (git tags are not maintained so "@latest" serves a stale utils.js)`,
    name: '@require self ref',
  },
]

export const codeRules: Rule[] = [
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

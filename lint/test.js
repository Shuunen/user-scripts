/* eslint-disable no-undef */
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/naming-convention
const { RuleTester } = require('eslint')
const plugin = require('./index.js')
const rule = plugin.rules['enforce-download-url']
const ruleTester = new RuleTester()
ruleTester.run('enforce-download-url', rule, {
  invalid: [{
    code: `// ==UserScript==
// @name  A name
// ==/UserScript==`,
    // we can use messageId from the rule object
    errors: [{ messageId: 'specifyDownloadURL' }],
  }],
  valid: [{
    code: `// ==UserScript==
// @downloadURL  https://example.com
// ==/UserScript==`,
  }],
})

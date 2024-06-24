// @ts-ignore
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
    output: `// ==UserScript==
// @name  A name
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/<input>
// ==/UserScript==`,
  }],
  valid: [{
    code: `// ==UserScript==
// @downloadURL  https://example.com
// ==/UserScript==`,
  }],
})

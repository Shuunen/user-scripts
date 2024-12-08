'use strict'

// @ts-expect-error missing types
const shuunen = require('eslint-plugin-shuunen')
const userscripts = require('eslint-plugin-userscripts') // @ts-ignore
const custom = require('./lint/index')

const noRestrictedSyntaxRules = shuunen.configs.base[1].rules['no-restricted-syntax'].slice(1)

module.exports = [
  ...shuunen.configs.base,
  ...shuunen.configs.browser,
  ...shuunen.configs.node,
  // ...shuunen.configs.typescript, // add me when you have a big hour to fix the 1300+ errors ^^''
  {
    languageOptions: {
      globals: {
        addMbField: false,
        addMbSubmit: false,
        createMbForm: false,
        insertMbForm: false,
        module: false,
        Shuutils: false,
        textFromSelector: false,
      },
    },
    name: 'user-scripts-overrides',
    rules: {
      'max-lines': 'off', // we have some long scripts
      'no-restricted-syntax': [
        'error',
        ...noRestrictedSyntaxRules,
        {
          message: 'Dont forget to remove this temporary second argument from Shuutils constructor',
          selector: 'NewExpression[callee.name="Shuutils"][arguments.length>1]',
        },
      ],
      'unicorn/prefer-module': 'off',
    },
  },
  // custom lint
  {
    name: 'user-scripts-custom-lint-plugin',
    plugins: {
      '@custom': {
        rules: custom.rules,
      },
    },
    rules: {
      '@custom/enforce-download-url': 'error',
    },
  },
  // userscripts
  {
    files: ['*.user.js'],
    name: 'user-scripts-userscripts-plugin',
    plugins: {
      userscripts: {
        rules: userscripts.rules,
      },
    },
    rules: {
      ...userscripts.configs.recommended.rules,
    },
    settings: {
      userscriptVersions: {
        violentmonkey: '*',
      },
    },
  },
]

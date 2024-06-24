'use strict'

// @ts-expect-error missing types
const shuunen = require('eslint-plugin-shuunen')
const userscripts = require('eslint-plugin-userscripts') // @ts-ignore
const custom = require('./lint/index')

module.exports = [
  ...shuunen.configs.base,
  ...shuunen.configs.browser,
  ...shuunen.configs.node,
  {
    languageOptions: {
      globals: {
        Shuutils: false,
        addMbField: false,
        addMbSubmit: false,
        createMbForm: false,
        insertMbForm: false,
        module: false,
        textFromSelector: false,
      },
    },
    rules: {
      'max-lines': 'off', // we have some long scripts
      'unicorn/prefer-module': 'off',
    },
  },
  // custom lint
  {
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
    plugins: {
      'userscripts': {
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

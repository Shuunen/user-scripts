const rules = require('./.eslintrc.rules.js')

module.exports = {
  extends: [
    'eslint:recommended',
    'standard',
    'plugin:unicorn/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules,
  plugins: ['unicorn'],
}

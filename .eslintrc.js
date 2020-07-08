const rules = require('./.eslintrc.rules.js')

module.exports = {
  extends: [
    'plugin:unicorn/recommended',
    'standard',
  ],
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules,
  plugins: ['unicorn'],
}

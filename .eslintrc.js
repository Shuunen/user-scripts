/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-undef */

const rules = {
  '@typescript-eslint/array-type': 'off',
  '@typescript-eslint/brace-style': [
    'error',
    '1tbs',
    {
      allowSingleLine: true,
    },
  ],
  '@typescript-eslint/comma-dangle': [
    'error',
    'always-multiline',
  ],
  '@typescript-eslint/consistent-indexed-object-style': 'off',
  '@typescript-eslint/consistent-type-definitions': 'off',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      fixStyle: 'inline-type-imports',
      prefer: 'type-imports',
    },
  ],
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/indent': [
    'error',
    2,
  ],
  '@typescript-eslint/lines-around-comment': 'off',
  '@typescript-eslint/lines-between-class-members': 'off',
  '@typescript-eslint/member-delimiter-style': [
    'error',
    {
      multiline: {
        delimiter: 'none',
      },
    },
  ],
  '@typescript-eslint/no-confusing-void-expression': 'off',
  '@typescript-eslint/no-type-alias': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^(_|global)',
    },
  ],
  '@typescript-eslint/object-curly-spacing': [
    'error',
    'always',
  ],
  '@typescript-eslint/parameter-properties': [
    'error',
    {
      prefer: 'parameter-property',
    },
  ],
  '@typescript-eslint/prefer-destructuring': 'off',
  '@typescript-eslint/prefer-readonly-parameter-types': 'off',
  '@typescript-eslint/quotes': [
    'error',
    'single',
  ],
  '@typescript-eslint/semi': [
    'error',
    'never',
  ],
  'capitalized-comments': 'off',
  'comma-dangle': [
    'error',
    'always-multiline',
  ],
  'compat/compat': 'off',
  'curly': [
    'error',
    'multi',
  ],
  'eslint-comments/no-use': 'off',
  'etc/no-commented-out-code': 'off',
  'etc/no-const-enum': 'off',
  'etc/no-deprecated': 'off',
  'etc/no-enum': 'off',
  'etc/no-internal': 'off',
  'etc/no-misused-generics': 'off',
  'etc/prefer-interface': 'off',
  'ext/lines-between-object-properties': 'off',
  'filenames/match-regex': [
    2,
    '(\\.user|utils|types|\\.test|\\.d|\\.config)$',
    true,
  ],
  'func-names': [
    'error',
    'always',
  ],
  'id-length': [
    'error',
    {
      exceptions: [
        't',
      ],
      min: 2,
    },
  ],
  'import/default': 'off',
  'import/export': 'off',
  'import/extensions': 'off',
  'import/first': 'off',
  'import/named': 'off',
  'import/namespace': 'off',
  'import/newline-after-import': 'off',
  'import/no-absolute-path': 'off',
  'import/no-amd': 'off',
  'import/no-cycle': 'off',
  'import/no-deprecated': 'off',
  'import/no-duplicates': 'off',
  'import/no-dynamic-require:': 'off',
  'import/no-extraneous-dependencies': 'off',
  'import/no-import-module-exports': 'off',
  'import/no-mutable-exports': 'off',
  'import/no-named-as-default': 'off',
  'import/no-named-as-default-member': 'off',
  'import/no-named-default': 'off',
  'import/no-relative-packages': 'off',
  'import/no-self-import': 'off',
  'import/no-unassigned-import': 'off',
  'import/no-unresolved': 'off',
  'import/no-unused-modules': 'off',
  'import/no-useless-path-segments': 'off',
  'import/no-webpack-loader-syntax': 'off',
  'import/order': 'off',
  'import/prefer-default-export': 'off',
  'indent': 'off',
  'line-comment-position': 'off',
  'lines-around-comment': 'off',
  'lines-between-class-members': 'off',
  'logical-assignment-operators': 'off',
  'max-len': 'off',
  'max-lines': 'off',
  'max-statements-per-line': 'off',
  'no-console': 'error',
  'no-inline-comments': 'off',
  'no-unsanitized/property': 'off',
  'object-curly-spacing': [
    'error',
    'always',
  ],
  'padding-line-between-statements': 'off',
  'prefer-destructuring': 'off',
  'prettier/prettier': 'off',
  'putout/putout': 'off',
  'quote-props': [
    'error',
    'consistent-as-needed',
  ],
  'quotes': 'off',
  'regexp/require-unicode-sets-regexp': 'off',
  'require-atomic-updates': [
    'error',
    {
      allowProperties: true,
    },
  ],
  'semi': [
    'error',
    'never',
  ],
  'simple-import-sort/imports': 'off',
  'space-before-function-paren': [
    'error',
    'always',
  ],
  'total-functions/no-partial-division': 'off',
  'total-functions/no-unsafe-readonly-mutable-assignment': 'off',
  'unicorn/no-array-for-each': 'off',
  'unicorn/no-process-exit': 'off',
  'unicorn/prefer-module': 'off',
  'unicorn/prefer-node-protocol': 'off',
  'unicorn/prefer-spread': 'off',
  'unicorn/prefer-string-replace-all': 'off',
  'unicorn/prefer-switch': 'off',
  'unicorn/prevent-abbreviations': [
    'error',
    {
      allowList: {
        args: true,
        pkg: true,
        str: true,
      },
    },
  ],
  'unicorn/switch-case-braces': 'off',
}

module.exports = {
  env: {
    browser: true,
    es6: true,
    node: false,
  },
  extends: [
    'plugin:tailwindcss/recommended',
    'plugin:unicorn/all',
    'hardcore',
    'hardcore/ts',
  ],
  ignorePatterns: [
    'node_modules',
    'dist',
    'bin',
    'docs',
  ],
  overrides: [
    {
      extends: [
        'plugin:tailwindcss/recommended',
        'plugin:unicorn/all',
        'hardcore/ts-for-js',
        'plugin:userscripts/recommended',
      ],
      files: [
        '*.js',
      ],
      parserOptions: {
        project: true,
      },
      rules: {
        ...rules,
        '@typescript-eslint/ban-ts-comment': 'off',
        'import/no-commonjs': 'off',
        'import/unambiguous': 'off',
      },
    },
    {
      files: [
        '.eslintrc.js',
      ],
      rules: {
        'filenames/match-regex': 'off',
        'userscripts/filename-user': 'off',
        'userscripts/no-invalid-metadata': 'off',
      },
    },
  ],
  parserOptions: {
    project: true,
  },
  plugins: [
    'filenames',
  ],
  root: true,
  rules,
  settings: {
    tailwindcss: {
      callees: [
        'tw',
        'utils.tw',
        'classnames',
      ],
      whitelist: [
        'app-[a-z-]+',
      ],
    },
  },
}

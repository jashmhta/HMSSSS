module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier'],
  extends: [
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
    'plugin:security/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/', 'coverage/'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: [
          'signature',
          'field',
          'constructor',
          'method',
        ],
      },
    ],

    // General code quality rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-return-await': 'error',
    'no-throw-literal': 'error',
    'no-unused-expressions': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',
    'arrow-spacing': 'error',

    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-new-buffer': 'error',

    // Custom enterprise rules
    'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
    'max-params': ['error', 4],
    'max-depth': ['error', 4],
    'max-nested-callbacks': ['error', 3],
    'complexity': ['error', 10],

    // Import rules
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        allowSeparatedGroups: false,
      },
    ],

    // Promise rules
    'no-async-promise-executor': 'error',
    'require-await': 'error',

    // Error handling
    'handle-callback-err': 'error',
    'no-new-require': 'error',

    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-alert': 'error',
    'no-bitwise': 'error',
    'no-constructor-return': 'error',
    'no-duplicate-imports': 'error',
    'no-self-compare': 'error',
    'no-template-curly-in-string': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unreachable-loop': 'error',
    'no-unsafe-negation': 'error',
    'require-atomic-updates': 'error',

    // Prettier integration
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        tabWidth: 2,
        semi: true,
        printWidth: 100,
        bracketSpacing: true,
        arrowParens: 'avoid',
        endOfLine: 'lf',
      },
    ],
  },
  overrides: [
    {
      files: ['*.spec.ts', '*.test.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'max-lines-per-function': 'off',
        'max-lines': 'off',
        'no-console': 'off',
        'security/detect-object-injection': 'off',
      },
    },
    {
      files: ['src/database/**/*.ts'],
      rules: {
        'max-lines': 'off',
        'max-lines-per-function': 'off',
      },
    },
    {
      files: ['src/**/*.config.ts'],
      rules: {
        'max-lines': 'off',
        'no-console': 'off',
      },
    },
  ],
};
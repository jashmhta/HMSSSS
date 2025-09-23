module.exports = {
  // Frontend ESLint configuration for Next.js Hospital Management System
  // Enterprise-grade standards with React and TypeScript best practices
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
    serviceworker: true,
  },
  extends: [
    'eslint:recommended',
    'next/core-web-vitals',
    'next/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:sonarjs/recommended',
    'plugin:unicorn/recommended',
    'plugin:promise/recommended',
    'plugin:security/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      globalReturn: false,
    },
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    warnOnUnsupportedTypeScriptVersion: true,
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
    'sonarjs',
    'unicorn',
    'promise',
    'security',
    'eslint-plugin-header',
    'eslint-plugin-jsdoc',
    'eslint-plugin-no-secrets',
    'eslint-plugin-pii',
    'eslint-plugin-react-perf',
  ],
  rules: {
    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed with Next.js
    'react/prop-types': 'off', // Using TypeScript
    'react/jsx-uses-react': 'off', // Not needed with Next.js
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-pascal-case': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-children-prop': 'error',
    'react/no-danger-with-children': 'error',
    'react/no-deprecated': 'error',
    'react/no-did-mount-set-state': 'error',
    'react/no-did-update-set-state': 'error',
    'react/no-will-update-set-state': 'error',
    'react/no-this-in-sfc': 'error',
    'react/no-unescaped-entities': 'warn',
    'react/no-unknown-property': 'error',
    'react/require-render-return': 'error',
    'react/self-closing-comp': 'error',
    'react/sort-comp': ['error', {
      order: [
        'static-methods',
        'instance-variables',
        'lifecycle',
        '/^on.+$/',
        '/^get.+$/',
        '/^set.+$/',
        'everything-else',
        'render'
      ]
    }],

    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': ['error', {
      enableDangerousAutofixThisMayCauseInfiniteLoops: false,
      additionalHooks: '(useRecoilCallback|useRecoilTransaction_UNSTABLE)'
    }],

    // React performance rules
    'react-perf/jsx-no-new-object-as-prop': 'error',
    'react-perf/jsx-no-new-array-as-prop': 'error',
    'react-perf/jsx-no-jsx-as-prop': 'error',
    'react-perf/jsx-no-new-function-as-prop': 'error',
    'react-perf/jsx-no-inline-styles': 'error',

    // React security rules
    'react/no-danger': ['error', { forbid: ['children'] }],
    'react/jsx-no-comment-textnodes': 'error',
    'react/jsx-no-script-url': 'error',
    'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
    'react/no-unknown-property': ['error', { ignore: ['jsx', 'global'] }],

    // Accessibility rules (WCAG 2.1 AA compliance)
    'jsx-a11y/alt-text': ['error', { elements: ['img', 'object', 'area', 'input[type="image"]'] }],
    'jsx-a11y/anchor-is-valid': ['error', { components: ['Link'], specialLink: ['hrefLeft', 'hrefRight'] }],
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/click-events-have-key-events': ['error', { allowNonTabbableRotors: true }],
    'jsx-a11y/no-static-element-interactions': ['error', { allowExpressionValues: true }],
    'jsx-a11y/no-noninteractive-element-interactions': ['error', { handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onKeyPress', 'onKeyDown', 'onKeyUp'] }],
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-autofocus': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',
    'jsx-a11y/heading-has-content': 'error',
    'jsx-a11y/label-has-associated-control': ['error', { required: { some: ['nesting', 'id'] } }],
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/control-has-associated-label': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/scope': 'error',

    // TypeScript strict mode compliance
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    '@typescript-eslint/no-explicit-any': ['error', {
      ignoreRestArgs: true,
      fixToUnknown: true,
      allowInCatchClause: false
    }],
    '@typescript-eslint/no-non-null-assertion': ['error', { enforceForThisProperties: true }],
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/no-unsafe-declaration-merging': 'error',
    '@typescript-eslint/no-unsafe-enum-comparison': 'error',
    '@typescript-eslint/no-unsafe-unary-minus': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/unbound-method': 'error',
    '@typescript-eslint/restrict-plus-operands': 'error',
    '@typescript-eslint/restrict-template-expressions': ['error', {
      allowNumber: true,
      allowBoolean: true,
      allowAny: false,
      allowNullish: false,
      allowRegExp: false
    }],
    '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true, ignoreIIFE: true }],
    '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: true }],
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', disallowTypeAnnotations: true }],
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/naming-convention': ['error',
      {
        selector: 'default',
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
      {
        selector: 'interface',
        prefix: ['I'],
        format: ['PascalCase'],
      },
    ],

    // Import organization
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index',
        'object',
        'type'
      ],
      pathGroups: [
        {
          pattern: 'react',
          group: 'builtin',
          position: 'before'
        },
        {
          pattern: 'next/**',
          group: 'builtin',
          position: 'after'
        }
      ],
      pathGroupsExcludedImportTypes: ['react', 'next'],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      },
      distinctGroup: false,
      warnOnUnassignedImports: true
    }],
    'import/no-unresolved': ['error', { commonjs: true, amd: true }],
    'import/named': 'error',
    'import/default': 'error',
    'import/namespace': 'error',
    'import/export': 'error',
    'import/no-duplicates': 'error',
    'import/no-unused-modules': ['error', { unusedExports: true }],
    'import/no-cycle': ['error', { maxDepth: 1 }],
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': 'error',
    'import/no-relative-parent-imports': 'error',
    'import/dynamic-import-chunkname': 'error',
    'import/first': 'error',
    'import/exports-last': 'error',
    'import/no-absolute-path': 'error',
    'import/no-webpack-loader-syntax': 'error',

    // SonarJS code quality rules
    'sonarjs/cognitive-complexity': ['error', 15],
    'sonarjs/no-duplicate-string': 'error',
    'sonarjs/no-identical-functions': 'error',
    'sonarjs/no-collection-size-mischeck': 'error',
    'sonarjs/no-collapsible-if': 'error',
    'sonarjs/no-all-duplicated-branches': 'error',
    'sonarjs/no-element-overwrite': 'error',
    'sonarjs/no-identical-conditions': 'error',
    'sonarjs/no-use-of-empty-return-value': 'error',
    'sonarjs/no-unused-collection': 'error',
    'sonarjs/prefer-immediate-return': 'error',
    'sonarjs/prefer-object-literal': 'error',

    // Enterprise-grade security rules
    'no-secrets/no-secrets': ['error', {
      tolerance: 0.01,
      additionalKeywords: ['apiKey', 'api_key', 'apiSecret', 'api_secret', 'privateKey', 'private_key'],
      ignoreProperties: true,
      ignoreClassFields: true,
      ignoreIdentifierNames: true
    }],

    // PII/PHI data handling rules
    'pii/no-emails': 'error',
    'pii/no-phone-numbers': 'error',
    'pii/no-ssn': 'error',
    'pii/no-credit-cards': 'error',

    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-bidi-characters': 'error',
    'security/detect-unsafe-code': ['error', { minimumSeverity: 'warning' }],

    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-object-spread': 'error',
    'object-shorthand': 'error',
    'no-throw-literal': 'error',
    'no-return-await': 'error',
    'require-await': 'error',
    'no-async-promise-executor': 'error',
    'no-useless-escape': 'off', // Sometimes needed for regex
    'no-unsafe-negation': 'error',
    'no-unsafe-optional-chaining': 'error',
    'no-unsafe-assignment': 'error',
    'no-unsafe-return': 'error',
    'no-unsafe-member-access': 'error',
    'no-unsafe-call': 'error',
    'require-atomic-updates': 'error',
    'no-sync': 'error',
    'no-process-env': 'error', // Use Next.js config instead
    'no-process-exit': 'error',

    // Code style and complexity
    'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
    'max-depth': ['error', 4],
    'max-params': ['error', 4],
    'max-nested-callbacks': ['error', 3],
    'complexity': ['error', 10],
    'no-multiple-empty-lines': ['error', { max: 2 }],
    'padded-blocks': ['error', 'never'],
    'space-before-blocks': 'error',
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'comma-spacing': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'quote-props': ['error', 'as-needed'],
    'dot-notation': 'error',
    'eqeqeq': ['error', 'always'],
    'no-unused-vars': 'off', // Handled by TypeScript
    'no-use-before-define': 'off', // Handled by TypeScript
    'no-undef': 'off', // Handled by TypeScript

    // Healthcare specific rules
    'max-len': ['warn', {
      code: 120,
      ignoreComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true
    }], // Allow longer for complex healthcare data
    'id-length': ['error', {
      min: 2,
      exceptions: ['id', 'ID', 'DB', 'IO', 'IP', 'OP', 'ER', 'ICU', 'ED', 'EMR', 'EHR', 'PHI', 'PII', 'HIPAA', 'GDPR', 'i', 'x', 'y', 'z']
    }], // Healthcare acronyms and common vars
    'no-magic-numbers': ['error', {
      ignore: [0, 1, -1, 2, 100, 1000, 200, 201, 400, 401, 403, 404, 500, // HTTP codes
             60, 72, 98.6, 37, 120/80, // Medical vitals
             24, 7, 30, 365, // Time periods
             100, 200, 300, 400, 500, 1000, // Common thresholds
             18, 21, 65, // Age thresholds
             300, 400, 500 // Dosage limits
      ],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true
    }],
    'require-unicode-regexp': 'error', // Ensure proper regex handling
    'no-unsafe-regex': 'error',

    // Next.js specific rules
    '@next/next/no-img-element': 'error', // Use next/image
    '@next/next/no-page-custom-font': 'error', // Use next/font
    '@next/next/no-typos': 'error',
    '@next/next/no-css-tags': 'error', // Use CSS modules or styled-jsx
    '@next/next/no-script-component-in-head': 'error',
    '@next/next/no-before-interactive-script-outside-document': 'error',
    '@next/next/no-sync-scripts': 'error',

    // Unicorn rules (modern JavaScript)
    'unicorn/no-nested-ternary': 'error',
    'unicorn/no-array-for-each': 'error',
    'unicorn/prefer-array-flat': 'error',
    'unicorn/prefer-array-flat-map': 'error',
    'unicorn/prefer-array-index-of': 'error',
    'unicorn/prefer-array-some': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-regexp-test': 'error',
    'unicorn/prefer-string-starts-ends-with': 'error',
    'unicorn/prefer-string-replace-all': 'error',
    'unicorn/prefer-string-slice': 'error',
    'unicorn/prefer-string-trim-start-end': 'error',
    'unicorn/prefer-switch': 'error',
    'unicorn/prefer-ternary': 'error',
    'unicorn/explicit-length-check': 'error',
    'unicorn/no-for-loop': 'error',
    'unicorn/no-lonely-if': 'error',
    'unicorn/no-new-array': 'error',
    'unicorn/no-new-buffer': 'error',
    'unicorn/no-useless-undefined': 'error',
    'unicorn/consistent-function-scoping': 'error',
    'unicorn/filename-case': ['error', { case: 'camelCase', ignore: ['^\[', '\]$'] }],

    // Promise rules
    'promise/always-return': 'error',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-native': 'off', // Allow native promises
    'promise/no-nesting': 'error',
    'promise/no-promise-in-callback': 'error',
    'promise/no-callback-in-promise': 'error',
    'promise/valid-params': 'error',

    // Code style and complexity
    'max-lines-per-function': ['error', {
      max: 50,
      skipBlankLines: true,
      skipComments: true,
      ignoreComments: true
    }],
    'max-depth': ['error', 4],
    'max-params': ['error', 4],
    'max-nested-callbacks': ['error', 3],
    'complexity': ['error', 10],
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    'padded-blocks': ['error', 'never'],
    'space-before-blocks': 'error',
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'comma-spacing': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'quote-props': ['error', 'as-needed'],
    'dot-notation': 'error',
    'eqeqeq': ['error', 'always'],
    'no-undef': 'off', // Handled by TypeScript
    'no-unused-vars': 'off', // Handled by TypeScript
    'no-use-before-define': 'off', // Handled by TypeScript
  },
  overrides: [
    // Test files
    {
      files: ['**/*.spec.tsx', '**/*.test.tsx', '**/*.spec.ts', '**/*.test.ts'],
      rules: {
        'no-console': 'off',
        'max-lines-per-function': 'off',
        'max-lines': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'sonarjs/no-duplicate-string': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/no-noninteractive-element-interactions': 'off',
        'no-secrets/no-secrets': 'off',
        'pii/no-emails': 'off',
        'pii/no-phone-numbers': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        'react/prop-types': 'off',
        'react/no-unused-prop-types': 'off',
        'react/require-default-props': 'off',
      },
    },
    // Configuration files
    {
      files: ['**/*.config.js', '**/*.config.ts', '**/jest.config.js', '**/.babelrc.js', '**/next.config.js'],
      rules: {
        'no-console': 'off',
        'max-lines-per-function': 'off',
        'max-lines': 'off',
        'sonarjs/cognitive-complexity': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off',
        'unicorn/prevent-abbreviations': 'off',
        'import/no-commonjs': 'off',
        'no-process-env': 'off',
        'security/detect-non-literal-fs-filename': 'off',
      },
    },
    // Storybook stories
    {
      files: ['**/*.stories.tsx', '**/*.stories.js'],
      rules: {
        'no-console': 'off',
        'max-lines-per-function': 'off',
        'max-lines': 'off',
        'jsx-a11y/alt-text': 'off',
        'react/prop-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'sonarjs/no-duplicate-string': 'off',
      },
    },
    // API routes - stricter security
    {
      files: ['pages/api/**/*.ts', 'src/app/api/**/*.ts'],
      rules: {
        'security/detect-object-injection': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        'max-lines-per-function': ['error', { max: 30 }],
        'complexity': ['error', 8],
        'no-process-env': 'error',
      },
    },
    // Components with forms - stricter validation
    {
      files: ['src/components/**/form*.tsx', 'src/components/**/Form*.tsx'],
      rules: {
        'jsx-a11y/label-has-associated-control': ['error', { required: { some: ['nesting', 'id'] } }],
        'jsx-a11y/control-has-associated-label': 'error',
        'react/no-unescaped-entities': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        'no-unsafe-regex': 'error',
      },
    },
    // Components with medical data - PHI rules
    {
      files: ['src/components/**/patient*.tsx', 'src/components/**/medical*.tsx', 'src/components/**/health*.tsx'],
      rules: {
        'pii/no-emails': 'error',
        'pii/no-phone-numbers': 'error',
        'pii/no-ssn': 'error',
        'pii/no-credit-cards': 'error',
        'react/no-danger': 'error',
        'react/jsx-no-comment-textnodes': 'error',
        'no-console': ['error', { allow: [] }],
      },
    },
    // Layout components
    {
      files: ['src/components/layout/*.tsx', 'src/app/layout.tsx'],
      rules: {
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/anchor-is-valid': 'error',
        'jsx-a11y/role-has-required-aria-props': 'error',
        'jsx-a11y/interactive-supports-focus': 'error',
        'jsx-a11y/tabindex-no-positive': 'error',
      },
    },
  ],
  reportUnusedDisableDirectives: true,
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import/core-modules': ['react', 'next'],
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    jsdoc: {
      mode: 'typescript',
    },
    'jsx-a11y': {
      components: {
        Link: 'a',
        NextLink: 'a',
      },
    },
  },
  ignorePatterns: [
    '.next/*',
    'node_modules/*',
    'out/*',
    'build/*',
    'dist/*',
    '*.min.js',
    'coverage/*',
    'jest.config.js',
    'next.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    '.eslintrc.js',
    'public/*',
  ],
};
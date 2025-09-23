module.exports = {
  // Enterprise-grade Prettier configuration for Hospital Management System
  // Optimized for healthcare applications with readability and consistency

  // Basic formatting
  semi: true,
  trailingComma: 'all',
  singleQuote: true,
  quoteProps: 'as-needed',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf',

  // JSX formatting
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // Spacing
  bracketSpacing: true,
  arrowParens: 'avoid',

  // HTML/JSX whitespace
  htmlWhitespaceSensitivity: 'css',

  // Embedded formatting
  embeddedLanguageFormatting: 'auto',

  // Healthcare-specific overrides
  overrides: [
    {
      files: ['**/*.md', '**/*.mdx'],
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
    {
      files: ['**/*.json', '**/*.jsonc'],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ['**/*.yml', '**/*.yaml'],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ['prisma/schema.prisma'],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      options: {
        printWidth: 120, // Allow longer lines for test descriptions
      },
    },
  ],

  // Import order plugin integration
  importOrder: [
    '^react$',
    '^next',
    '<THIRD_PARTY_MODULES>',
    '^@/',
    '^~/',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    // Handle CSS modules and other assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(mp3|wav|ogg|mpe?g)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(woff|woff2|eot|ttf|otf)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/lib/next-i18next.config.js',
    '!src/**/*.config.{js,ts}',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Critical components have higher thresholds
    './src/components/auth/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/components/common/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/hooks/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/test/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  verbose: true,
  testTimeout: 10000,
  maxWorkers: '50%',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        'next/babel',
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript'
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-private-methods',
        '@babel/plugin-proposal-private-property-in-object'
      ]
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
      diagnostics: {
        warnOnly: true
      }
    }
  },
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(swiper|ssr-window|dom7|@mui|@emotion|@babel|@testing-library|abort-controller).*)',
  ],
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  // Coverage reporting
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json',
    'json-summary',
    'clover'
  ],
  // Setup files
  setupFiles: [
    '<rootDir>/jest.polyfills.js'
  ],
  // Setup files to run after the test environment is established
  setupFilesAfterEnv: [
    '<rootDir>/jest.react18.setup.js'
  ],
  // Mock files
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  // Clear mocks before each test
  clearMocks: true,
  // Reset mocks before each test
  resetMocks: true,
  // Restore mocks before each test
  restoreMocks: true,
  // Detect open handles
  detectOpenHandles: true,
  // Force exit
  forceExit: true,
  // Error handling
  errorOnDeprecated: true,
  // Performance monitoring
  slowTestThreshold: 3000,
  // Test reporters
  reporters: ['default']
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
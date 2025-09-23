import { defineConfig, devices } from '@playwright/test'

/**
 * Enterprise-grade E2E Testing Configuration for Hospital Management System
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    ['list'],
    ['allure-playwright'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Default timeout */
    timeout: 30000,

    /* Test timeout */
    testTimeout: 60000,

    /* Action timeout */
    actionTimeout: 10000,

    /* Navigation timeout */
    navigationTimeout: 30000,

    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,

    /* Viewport size */
    viewport: { width: 1280, height: 720 },

    /* User agent */
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },

    /* Geolocation */
    geolocation: { latitude: 40.7128, longitude: -74.0060 },

    /* Permissions */
    permissions: ['geolocation'],

    /* Launch options */
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
      headless: process.env.HEADLESS !== 'false',
    },

    /* Context options */
    contextOptions: {
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      grep: /@chrome|@desktop/i,
      grepInvert: /@mobile|@tablet/i,
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
      grep: /@firefox|@desktop/i,
      grepInvert: /@mobile|@tablet/i,
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
      grep: /@safari|@desktop/i,
      grepInvert: /@mobile|@tablet/i,
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 412, height: 915 },
        isMobile: true,
        hasTouch: true,
      },
      grep: /@chrome|@mobile/i,
      grepInvert: /@desktop|@tablet/i,
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
      grep: /@safari|@mobile/i,
      grepInvert: /@desktop|@tablet/i,
    },

    /* Tablet tests */
    {
      name: 'Tablet Safari',
      use: {
        ...devices['iPad (gen 7)'],
        viewport: { width: 810, height: 1080 },
        isMobile: true,
        hasTouch: true,
      },
      grep: /@tablet/i,
    },

    /* Accessibility tests */
    {
      name: 'Accessibility',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      grep: /@accessibility/i,
    },

    /* Performance tests */
    {
      name: 'Performance',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      grep: /@performance/i,
    },

    /* Security tests */
    {
      name: 'Security',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      grep: /@security/i,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
    },
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),

  /* Expect configuration */
  expect: {
    timeout: 10000,
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.1,
    },
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
    toPass: {
      intervals: [100, 250, 500, 1000],
      timeout: 30000,
    },
  },

  /* Metadata */
  metadata: {
    env: process.env.NODE_ENV || 'test',
    app: 'Hospital Management System',
    version: '1.0.0',
    testType: 'e2e',
  },

  /* Test configuration */
  testMatch: [
    '**/e2e/**/*.spec.{ts,js}',
    '**/e2e/**/*.test.{ts,js}',
  ],

  /* Timeout configuration */
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  /* Reporter configuration */
  reporter: [
    ['html', { open: process.env.CI ? 'never' : 'on-failure' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    ['list'],
    ['allure-playwright', {
      detail: true,
      suiteTitle: true,
      categories: [
        {
          name: 'Authentication Tests',
          matchedStatuses: ['passed', 'failed', 'broken', 'skipped'],
        },
        {
          name: 'Patient Management Tests',
          matchedStatuses: ['passed', 'failed', 'broken', 'skipped'],
        },
        {
          name: 'Appointment Tests',
          matchedStatuses: ['passed', 'failed', 'broken', 'skipped'],
        },
        {
          name: 'Medical Records Tests',
          matchedStatuses: ['passed', 'failed', 'broken', 'skipped'],
        },
        {
          name: 'Accessibility Tests',
          matchedStatuses: ['passed', 'failed', 'broken', 'skipped'],
        },
        {
          name: 'Performance Tests',
          matchedStatuses: ['passed', 'failed', 'broken', 'skipped'],
        },
        {
          name: 'Security Tests',
          matchedStatuses: ['passed', 'failed', 'broken', 'skipped'],
        },
      ],
    }],
  ],

  /* Output directory */
  outputDir: 'test-results/',

  /* Snapshot directory */
  snapshotDir: './e2e/snapshots',

  /* Snapshot path template */
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testName}{arg}-{ext}',

  /* Workers configuration */
  workers: process.env.CI ? 1 : '50%',

  /* Max failures */
  maxFailures: process.env.CI ? 10 : undefined,

  /* Quiet mode */
  quiet: process.env.CI,

  /* Update snapshots */
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',

  /* Update source map */
  updateSourceMap: process.env.UPDATE_SOURCE_MAP === 'true',

  /* Preserve output */
  preserveOutput: process.env.CI ? 'failures-only' : 'always',

  /* Reporter process timeout */
  reporterProcessTimeout: process.env.CI ? 60000 : 30000,

  /* Global teardown timeout */
  globalTeardown: 30000,

  /* Global setup timeout */
  globalSetup: 30000,

  /* Test ignore */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/e2e/helpers/**',
    '**/e2e/fixtures/**',
  ],

  /* Test directories */
  testDir: './e2e',

  /* Fully parallel */
  fullyParallel: true,

  /* Forbid only */
  forbidOnly: !!process.env.CI,

  /* Retries */
  retries: process.env.CI ? 2 : 0,

  /* Workers */
  workers: process.env.CI ? 1 : undefined,

  /* Report slow tests */
  reportSlowTests: {
    max: 5,
    threshold: 15000,
  },
})
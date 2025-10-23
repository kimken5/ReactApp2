import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['github'],
    ['list']
  ],
  use: {
    baseURL: 'https://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    ignoreHTTPSErrors: true,
  },

  projects: [
    // Desktop Browsers
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'desktop-firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'desktop-safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile Devices - iOS
    {
      name: 'iphone-12',
      use: {
        ...devices['iPhone 12'],
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'iphone-13-pro',
      use: {
        ...devices['iPhone 13 Pro'],
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'iphone-14-plus',
      use: {
        ...devices['iPhone 14 Plus'],
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'iphone-se',
      use: {
        ...devices['iPhone SE'],
        hasTouch: true,
        isMobile: true,
      },
    },

    // Mobile Devices - Android
    {
      name: 'android-pixel-5',
      use: {
        ...devices['Pixel 5'],
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'android-galaxy-s8',
      use: {
        ...devices['Galaxy S8'],
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'android-galaxy-note-20',
      use: {
        channel: 'chrome',
        ...devices['Galaxy Note 20'],
        hasTouch: true,
        isMobile: true,
      },
    },

    // Tablets
    {
      name: 'ipad-pro',
      use: {
        ...devices['iPad Pro'],
        hasTouch: true,
        isMobile: false, // Tablet behavior
        viewport: { width: 1024, height: 1366 },
      },
    },
    {
      name: 'ipad-mini',
      use: {
        ...devices['iPad Mini'],
        hasTouch: true,
        isMobile: false,
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'galaxy-tab-s4',
      use: {
        channel: 'chrome',
        userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-T835) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        viewport: { width: 712, height: 1138 },
        deviceScaleFactor: 2.25,
        hasTouch: true,
        isMobile: false,
      },
    },

    // PWA Testing Configurations
    {
      name: 'pwa-android',
      use: {
        ...devices['Pixel 5'],
        hasTouch: true,
        isMobile: true,
        extraHTTPHeaders: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
        },
        permissions: ['camera', 'microphone', 'geolocation', 'notifications'],
      },
    },
    {
      name: 'pwa-ios',
      use: {
        ...devices['iPhone 13 Pro'],
        hasTouch: true,
        isMobile: true,
        permissions: ['camera', 'microphone', 'geolocation', 'notifications'],
      },
    },

    // Accessibility Testing
    {
      name: 'accessibility-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
          'User-Agent': 'Accessibility-Test-Agent',
        },
      },
    },
    {
      name: 'accessibility-mobile',
      use: {
        ...devices['iPhone 12'],
        hasTouch: true,
        isMobile: true,
        extraHTTPHeaders: {
          'User-Agent': 'Accessibility-Test-Agent-Mobile',
        },
      },
    },

    // Low-end Device Simulation
    {
      name: 'low-end-android',
      use: {
        channel: 'chrome',
        userAgent: 'Mozilla/5.0 (Linux; Android 8.1; Nokia 1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
        viewport: { width: 480, height: 854 },
        deviceScaleFactor: 1.5,
        hasTouch: true,
        isMobile: true,
        launchOptions: {
          slowMo: 100, // Simulate slower device
        },
      },
    },

    // Network Condition Testing
    {
      name: 'slow-3g',
      use: {
        ...devices['Pixel 5'],
        hasTouch: true,
        isMobile: true,
        extraHTTPHeaders: {
          'Connection': 'slow-3g',
        },
      },
    },
  ],

  // webServer: [
  //   {
  //     command: 'npm run dev',
  //     cwd: './reactapp.client',
  //     port: 5173,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //   },
  //   {
  //     command: 'dotnet run',
  //     cwd: './ReactApp.Server',
  //     port: 7154,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //   }
  // ],
});
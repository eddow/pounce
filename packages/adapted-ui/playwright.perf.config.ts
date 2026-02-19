import { defineConfig, devices } from '@playwright/test'

const port = 5275 // Demo app port defined in demo/vite.config.ts

export default defineConfig({
  testDir: './tests/e2e',
  // Only match the performance test
  testMatch: 'perf.spec.ts',
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: {
    command: 'npm run demo', // Starts the demo app on port 5275
    port,
    timeout: 120_000,
    reuseExistingServer: true, 
    // We don't rely only on the port to be ready, but just in case
  },
})

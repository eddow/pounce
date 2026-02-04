import { defineConfig, devices } from '@playwright/test'

declare const process: { env: { CI?: string } }

const isCI = Boolean(process.env.CI)
const projectRootDir = decodeURIComponent(new URL('.', import.meta.url).pathname)
const minimalAppPort = 5275
const blogAppPort = 5276

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,

  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${minimalAppPort}`,
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${minimalAppPort} --hmr-port ${minimalAppPort + 20000}`,
      cwd: `${projectRootDir}/tests/consumers/minimal-app`,
      url: `http://127.0.0.1:${minimalAppPort}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `PORT=${blogAppPort} npm run dev`,
      cwd: `${projectRootDir}/tests/consumers/blog-app`,
      url: `http://127.0.0.1:${blogAppPort}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})

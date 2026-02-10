import { defineConfig, devices } from '@playwright/test'

declare const process: { env: { CI?: string } }

const isCI = Boolean(process.env.CI)
const projectRootDir = decodeURIComponent(new URL('.', import.meta.url).pathname)
const port = 5274

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
    command: `node_modules/.bin/vite --host=127.0.0.1 --port=${port} --strictPort`,
    cwd: projectRootDir,
    port,
    timeout: 120_000,
    reuseExistingServer: true,
  },
})

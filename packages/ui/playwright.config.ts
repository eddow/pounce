import { defineConfig, devices } from '@playwright/test'
import { readdirSync } from 'fs'

declare const process: { env: { CI?: string } }

const isCI = Boolean(process.env.CI)
const projectRootDir = decodeURIComponent(new URL('.', import.meta.url).pathname)
const port = 5274

function hasTestFiles(dir: URL): boolean {
  try {
    for (const entry of readdirSync(dir.pathname, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (hasTestFiles(new URL(`${entry.name}/`, dir))) return true
        continue
      }
      if (!entry.isFile()) continue
      if (/\.test\.(ts|tsx)$/.test(String(entry.name))) return true
    }
  } catch {
    return false
  }

  return false
}

const hasE2eTests = hasTestFiles(new URL('./tests/e2e/', import.meta.url))

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
  ...(hasE2eTests
    ? {
    	webServer: {
    		command: `npm run dev -- --host=127.0.0.1 --port=${port} --strictPort`,
    		cwd: projectRootDir,
    		port,
    		timeout: 120_000,
    		reuseExistingServer: false,
    	},
    }
    : {}),
})

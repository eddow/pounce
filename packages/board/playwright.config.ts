import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const managedBrowsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH
	? path.resolve(process.env.PLAYWRIGHT_BROWSERS_PATH)
	: process.env.HOME
		? path.join(process.env.HOME, '.cache', 'ms-playwright')
		: ''
const hasManagedBrowsers = managedBrowsersPath ? fs.existsSync(managedBrowsersPath) : false
const firefoxExecutablePath = process.env.PLAYWRIGHT_FIREFOX_EXECUTABLE_PATH
const projects = [
	{
		name: 'chromium',
		use: hasManagedBrowsers
			? { ...devices['Desktop Chrome'] }
			: { ...devices['Desktop Chrome'], channel: 'chrome' as const },
	},
	...((hasManagedBrowsers || firefoxExecutablePath)
		? [
				{
					name: 'firefox',
					use:
						hasManagedBrowsers || !firefoxExecutablePath
							? { ...devices['Desktop Firefox'] }
							: {
									...devices['Desktop Firefox'],
									launchOptions: { executablePath: firefoxExecutablePath },
								},
				},
			]
		: []),
]

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5300',
    trace: 'on-first-retry',
  },
  projects,
  webServer: [
    {
      command: 'pnpm demo',
      url: 'http://localhost:5300',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
})

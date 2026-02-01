import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './tests',
	testMatch: /.*\.test\.(ts|tsx)/,
	timeout: 60_000,
	retries: 2,
	expect: {
		timeout: 10_000,
	},
	reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
	use: {
		baseURL: 'http://127.0.0.1:4183',
		headless: true,
		trace: 'retain-on-failure',
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 4183',
		port: 4183,
		reuseExistingServer: true,
		timeout: 120_000,
	},
})


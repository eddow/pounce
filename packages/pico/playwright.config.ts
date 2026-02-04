import { defineConfig, devices } from '@playwright/test'

const projectRootDir = decodeURIComponent(new URL('.', import.meta.url).pathname)
const port = 5277

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
		baseURL: `http://127.0.0.1:${port}`,
		headless: true,
		trace: 'retain-on-failure',
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
	},
	projects: [
		{
			name: 'chrome',
			use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		},
	],
	webServer: {
		command: `npm run dev -- --host=127.0.0.1 --port=${port} --strictPort`,
		cwd: projectRootDir,
		port,
		reuseExistingServer: false,
		timeout: 120_000,
	},
})


import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
	testDir: './tests',
	testMatch: '**/*.test.ts',

	timeout: 30_000,
	expect: {
		timeout: 5_000,
	},
	reporter: [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: 'http://127.0.0.1:5174',
		headless: true,
		trace: 'retain-on-failure',
		// Enable memoization discrepancy check in the browser
		launchOptions: {
			args: ['--js-flags="--expose-gc"'], // Just in case
		},
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npm run dev -- --host=127.0.0.1 --port=5174',
		port: 5174,
		timeout: 120_000,
		reuseExistingServer: true,
	},
})



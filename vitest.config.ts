import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'tests/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/dist/',
				'**/e2e/',
			],
		},
		projects: [
			'packages/core',
			'packages/kit',
			'packages/ui',
			'packages/board',
		],
	},
})

import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom',
	},
	resolve: {
		alias: {
			'@pounce/core': resolve(__dirname, '../../core/src'),
			'@pounce/ui': resolve(__dirname, '../../ui/src'),
		},
	},
})

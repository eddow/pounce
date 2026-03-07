import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { pounceCorePlugin } from '@pounce/core/plugin'

export default defineConfig({
	root: __dirname,
	plugins: [pounceCorePlugin()],
	resolve: {
		alias: [
			{ find: '@pounce/adapter-pico/css', replacement: resolve(__dirname, '../src/pico.sass') },
			{ find: '@pounce/adapter-pico', replacement: resolve(__dirname, '../src/index.ts') },
			{ find: '@pounce/ui/models', replacement: resolve(__dirname, '../../../ui/src/models/index.ts') },
			{ find: '@pounce/ui', replacement: resolve(__dirname, '../../../ui/src/index.ts') },
		],
	},
})

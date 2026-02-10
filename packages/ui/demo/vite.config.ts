import { defineConfig } from 'vite'
import { resolve } from 'path'
import { pounceCorePackage } from '@pounce/core/plugin'
import { pounceUIPlugin } from '../vite-plugin-pounce-ui'

export default defineConfig({
	root: resolve(import.meta.dirname, '.'),
	plugins: [
		...pounceCorePackage({
			core: {
				jsxRuntime: {
					runtime: 'automatic',
					importSource: '@pounce/core',
				},
			}
		}),
		pounceUIPlugin()
	],
	server: {
		port: 5275,
	},
})

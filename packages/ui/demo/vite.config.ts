import { defineConfig } from 'vite'
import { resolve } from 'path'
import { pounceUIPackage } from '@pounce/plugin/packages'

export default defineConfig({
	root: resolve(import.meta.dirname, '.'),
	plugins: [
		...pounceUIPackage({
			ui: {
				core: {
					jsxRuntime: {
						runtime: 'automatic',
						importSource: '@pounce/core',
					},
				}
			}
		})
	],
	server: {
		port: 5275,
	},
})

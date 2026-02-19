import { defineConfig } from 'vite'
import { resolve } from 'path'
import { pounceCorePackage } from '@pounce/core/plugin'
import { pureGlyfPlugin } from 'pure-glyf/plugin'

export default defineConfig({
	root: resolve(import.meta.dirname, '.'),
	plugins: [
		...pounceCorePackage(),
		pureGlyfPlugin({
			icons: { tabler: resolve(import.meta.dirname, '..', 'node_modules', '@tabler', 'icons', 'icons', 'outline') },
			dts: resolve(import.meta.dirname, 'pure-glyf.d.ts'),
		}),
	],
	server: {
		port: 5276,
		fs: {
			allow: [resolve(import.meta.dirname, '../../..')],
		},
	},
})

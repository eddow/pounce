import { defineConfig } from 'vite'
import { resolve } from 'path'
import { pounceUIPackage } from '@pounce/plugin/packages'

const pureGlyfRoot = resolve(import.meta.dirname, '../../../../../pure-glyf')

export default defineConfig(async () => {
	const { pureGlyfPlugin } = await import(resolve(pureGlyfRoot, 'dist/plugin.js'))
	return {
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
			}),
			pureGlyfPlugin({
				icons: { tabler: resolve(import.meta.dirname, '..', 'node_modules', '@tabler', 'icons', 'icons', 'outline') },
				dts: resolve(import.meta.dirname, 'pure-glyf.d.ts'),
			}),
		],
		resolve: {
			alias: [
				{ find: /^pure-glyf$/, replacement: resolve(pureGlyfRoot, 'dist/index.js') },
			],
		},
		server: {
			port: 5276,
			fs: {
				allow: [resolve(import.meta.dirname, '../../../../..')],
			},
		},
	}
})

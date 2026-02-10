import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'node:url'
import { pounceCorePlugin } from '@pounce/plugin/configs'

const dir = dirname(fileURLToPath(import.meta.url))
const kitRoot = resolve(dir, '../..')
const packagesRoot = resolve(kitRoot, '..')
const coreRoot = resolve(packagesRoot, 'core')
const muttsRoot = resolve(kitRoot, '../../../mutts')

export default defineConfig({
	root: dir,
	plugins: [
		pounceCorePlugin({
			projectRoot: dir,
			jsxRuntime: {
				runtime: 'automatic',
				importSource: '@pounce/core',
			},
		}),
	],
	esbuild: false,
	resolve: {
		conditions: ['browser', 'default', 'import'],
		alias: {
			'@pounce/core/jsx-runtime': resolve(coreRoot, 'src/runtime/jsx-runtime.ts'),
			'@pounce/core/jsx-dev-runtime': resolve(coreRoot, 'src/runtime/jsx-dev-runtime.ts'),
			'@pounce/core': resolve(coreRoot, 'src/lib/index.ts'),
			mutts: resolve(muttsRoot, 'src'),
		},
	},
	server: {
		fs: {
			allow: [kitRoot, coreRoot, muttsRoot, packagesRoot],
		},
	},
	optimizeDeps: {
		exclude: ['mutts'],
	},
})

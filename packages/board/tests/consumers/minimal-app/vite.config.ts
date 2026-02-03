import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { pounceCorePlugin } from '@pounce/plugin/configs'

const projectRootDir = resolve(__dirname)

export default defineConfig({
	resolve: {
		alias: {
			'@pounce/board/adapters': resolve(__dirname, '../../../src/adapters/hono.ts'),
			'@pounce/board/client': resolve(__dirname, '../../../src/client/index.ts'),
			'@pounce/board/server': resolve(__dirname, '../../../src/server/index.ts'),
			'@pounce/board': resolve(__dirname, '../../../src/client/index.ts'),
			'@pounce/core/jsx-runtime': resolve(__dirname, '../../../../core/src/runtime/jsx-runtime.ts'),
			'@pounce/core/jsx-dev-runtime': resolve(__dirname, '../../../../core/src/runtime/jsx-dev-runtime.ts'),
			'@pounce/core/server': resolve(__dirname, '../../../../core/src/lib/server.ts'),
			'@pounce/core': resolve(__dirname, '../../../../core/src/lib/index.ts'),
			'mutts': resolve(__dirname, '../../../../../../mutts/src/index.ts'),
			'@pounce/runtime/jsx-runtime': resolve(__dirname, '../../../../core/src/runtime/jsx-runtime.ts'),
			'@pounce/runtime/jsx-dev-runtime': resolve(__dirname, '../../../../core/src/runtime/jsx-dev-runtime.ts'),
			'@pounce/runtime': resolve(__dirname, '../../../../core/src/lib/index.ts'),
			'@pounce/kit': resolve(__dirname, '../../../../kit/src'),
		},
	},
	plugins: [
		pounceCorePlugin({
			projectRoot: projectRootDir,
			onlyRemoveTypeImports: true,
			jsxRuntime: {
				runtime: 'automatic',
				importSource: '@pounce/runtime',
			},
		}),
	],
	esbuild: false,
	server: {
		port: 3000,
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			input: {
				client: resolve(__dirname, 'index.html'),
			},
		},
	},
})

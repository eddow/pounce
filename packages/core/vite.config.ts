import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import { transformSync } from '@babel/core'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { babelPluginJsxReactive } from './src/babel-plugin-jsx-reactive'

const projectRootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	root: '.',
	server: {
		fs: {
			allow: [projectRootDir, resolvePath(projectRootDir, '../../../mutts')],
		},
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
			Pragma: 'no-cache',
			Expires: '0',
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				// SCSS options can be added here if needed
			}
		}
	},
	resolve: {
		alias: {
			'@pounce/runtime/jsx-runtime': resolvePath(projectRootDir, 'src/runtime/jsx-runtime.ts'),
			'@pounce/runtime/jsx-dev-runtime': resolvePath(projectRootDir, 'src/runtime/jsx-dev-runtime.ts'),
			'@pounce/runtime': resolvePath(projectRootDir, 'src/lib/index.ts'),
			'mutts': resolvePath(projectRootDir, '../../../mutts/src'),
			'npc-script': resolvePath(projectRootDir, '../../../npcs/src'),
			'omni18n': resolvePath(projectRootDir, '../../../omni18n/src'),
			'pure-glyf': resolvePath(projectRootDir, '../../../pure-glyf/src'),
		},
	},
	plugins: [
		{
			name: 'babel-jsx-transform',
			enforce: 'pre',
			async transform(code, id) {
				if (!/\.(tsx?|jsx?)$/.test(id)) return null
				
				const result = transformSync(code, {
					filename: id,
					cwd: projectRootDir,
					babelrc: false,
					configFile: false,
					plugins: [
					[babelPluginJsxReactive, { projectRoot: projectRootDir }],
					['@babel/plugin-proposal-decorators', { version: '2023-05' }],
						[
							'@babel/plugin-transform-react-jsx',
							{
								runtime: 'automatic',
								importSource: '@pounce/runtime',
								throwIfNamespace: false,
							},
						],
						['@babel/plugin-transform-typescript', { isTSX: id.endsWith('.tsx'), allowDeclareFields: true }],
					],
					sourceMaps: true,
				})
				
				if (!result) return null
				return { code: result.code || '', map: result.map as any }
			},
		} as Plugin,
	],
	esbuild: false,
	optimizeDeps: {
		exclude: ['mutts'],
	},
	build: {
		lib: {
			entry: {
				index: resolvePath(projectRootDir, 'src/index.ts'),
				'index-node': resolvePath(projectRootDir, 'src/index-node.ts'),
			},
			formats: ['es', 'cjs'],
			fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
		},
		rollupOptions: {
			external: ['mutts', 'jsdom', '@babel/core', 'node:path', 'node:url'],
		},
		outDir: 'dist',
		target: 'esnext',
		minify: false,
		sourcemap: true
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./tests/setup-mutts.ts'],
		include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx', 'tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],

	}
})


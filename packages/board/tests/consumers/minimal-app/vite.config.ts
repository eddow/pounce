import { resolve } from 'path'
import { defineConfig, type Plugin } from 'vite'
import { transformSync } from '@babel/core'

const projectRootDir = resolve(__dirname)

export default defineConfig({
	resolve: {
		alias: {
			'@pounce/board/adapters': resolve(__dirname, '../../../src/adapters/hono.ts'),
			'@pounce/board/client': resolve(__dirname, '../../../src/client/index.ts'),
			'@pounce/board/server': resolve(__dirname, '../../../src/server/index.ts'),
			'@pounce/board': resolve(__dirname, '../../../src/index.ts'),
			'@pounce/core/server': resolve(__dirname, '../../../../core/src/lib/server.ts'),
			'@pounce/core': resolve(__dirname, '../../../../core/src/lib/index.ts'),
			'mutts': resolve(__dirname, '../../../../mutts/src/index.ts'),
		},
	},
	plugins: [
		{
			name: 'babel-jsx-transform',
			enforce: 'pre',
			async transform(code, id) {
				if (!/\.(tsx?|jsx?)$/.test(id)) return null
				if (id.includes('node_modules')) return null
				
				const { babelPluginJsxReactive } = await import('../../../../core/src/babel-plugin-jsx-reactive.ts')
				
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
								runtime: 'classic',
								pragma: 'h',
								pragmaFrag: 'Fragment',
								throwIfNamespace: false,
							},
						],
						['@babel/plugin-transform-typescript', { isTSX: id.endsWith('.tsx'), allowDeclareFields: true, onlyRemoveTypeImports: true }],
					],
					sourceMaps: true,
				})
				
				if (!result) return null
				return { code: result.code || '', map: result.map as any }
			},
		} as Plugin,
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

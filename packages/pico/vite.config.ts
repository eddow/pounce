import { defineConfig, type Plugin } from 'vite'
import { transformSync } from '@babel/core'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRootDir = dirname(fileURLToPath(import.meta.url))

// @TEMPORARY: Using relative paths for build-time plugins to ensure they are loaded from source.
// This avoids ERR_UNKNOWN_FILE_EXTENSION that occurs when Node loads .ts files via package resolution.
import dts from 'vite-plugin-dts'
import { babelPluginJsxReactive } from '@pounce/core/plugin'
import { pureGlyfPlugin } from 'pure-glyf/plugin'
import { cssTagPlugin } from './vite-plugin-css-tag'

export default defineConfig({
	root: '.',
	css: {
		preprocessorOptions: {
			scss: {}
		}
	},
	plugins: [
		pureGlyfPlugin({
			icons: {
				tabler: 'node_modules/@tabler/icons/icons',
			},
			dts: 'src/types/pure-glyf.d.ts'
		}) as any,
		dts({
            rollupTypes: false,
            insertTypesEntry: true
        }),
		cssTagPlugin(),
		{
			name: 'babel-jsx-transform',
			enforce: 'pre',
			async transform(code, id) {
				if (!/\.(tsx?|jsx?)$/.test(id)) return null

				const result = transformSync(code, {
					filename: id,
					babelrc: false,
					configFile: false,
					plugins: [
						babelPluginJsxReactive,
						['@babel/plugin-proposal-decorators', { version: '2023-05' }],
						['@babel/plugin-transform-react-jsx', { pragma: 'h', pragmaFrag: 'Fragment', throwIfNamespace: false }],
						['@babel/plugin-transform-typescript', { isTSX: id.endsWith('.tsx'), allowDeclareFields: true }],
					],
					sourceMaps: true,
				})

				if (!result) return null
				return { code: result.code || '', map: result.map}
			},
		} as Plugin,
	],
	resolve: {
		alias: [
			{ find: 'mutts', replacement: resolvePath(projectRootDir, '../../../mutts/src') },
			{ find: '@pounce/core', replacement: resolvePath(projectRootDir, '../core/src') },
			{ find: /^pure-glyf$/, replacement: resolvePath(projectRootDir, '../../../pure-glyf/src') },
			{ find: /^pure-glyf\/(?!(icons|icons\.css))/, replacement: resolvePath(projectRootDir, '../../../pure-glyf/src/$1') },
			{ find: 'npc-script', replacement: resolvePath(projectRootDir, '../../../npcs/src') },
			{ find: 'omni18n', replacement: resolvePath(projectRootDir, '../../../omni18n/src') },
		],
	},
	esbuild: false,
	build: {
		outDir: 'dist',
		target: 'esnext',
		minify: false,
		sourcemap: true,
		lib: {
			entry: 'src/index.ts',
			formats: ['es'],
			fileName: () => 'index.js',
		},
		rollupOptions: {
			external: [
				'@pounce/core',
				'@picocss/pico',
			],
		},
	},
})




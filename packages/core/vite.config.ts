import { defineConfig } from 'vitest/config'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pounceCorePackage } from './src/plugin/index'

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
		conditions: ['browser', 'default', 'import'],
		alias: {
			'@pounce/core/jsx-runtime': resolvePath(projectRootDir, 'src/runtime/jsx-runtime.ts'),
			'@pounce/core/jsx-dev-runtime': resolvePath(projectRootDir, 'src/runtime/jsx-dev-runtime.ts'),
			'@pounce/core': resolvePath(projectRootDir, 'src/lib/index.ts'),
			'mutts': resolvePath(projectRootDir, '../../../mutts/src'),
		},
	},
	plugins: [
		...pounceCorePackage({
			core: {
				projectRoot: projectRootDir,
				jsxRuntime: {
					runtime: 'automatic',
					importSource: '@pounce/core',
				},
			},
			dts: {
				rollupTypes: true,
				afterBuild() {
					// Copy JSX types to dist, rewriting relative imports to point to rolled-up dom.d.ts
					const jsxSource = readFileSync(join(projectRootDir, 'src/types/jsx.d.ts'), 'utf8')
					const jsxDist = jsxSource
						.replace(/from\s+['"]\.\.\/lib(?:\/\w+)?['"]/g, "from './dom'")
						.replace(/from\s+['"]\.\.\/lib['"]/g, "from './dom'")
					writeFileSync(join(projectRootDir, 'dist/jsx.d.ts'), jsxDist)
					// Add /// <reference> to dom.d.ts and node.d.ts so consumers get JSX namespace
					for (const entry of ['dom.d.ts', 'node.d.ts']) {
						const file = join(projectRootDir, 'dist', entry)
						if (!existsSync(file)) continue
						const content = readFileSync(file, 'utf8')
						if (!content.includes('jsx.d.ts')) {
							writeFileSync(file, `/// <reference path="./jsx.d.ts" />\n${content}`)
						}
					}
				},
			}
		}),
	],
	esbuild: false,
	optimizeDeps: {
		exclude: ['mutts'],
	},
	build: {
		lib: {
			entry: {
				dom: resolvePath(projectRootDir, 'src/dom/index.ts'),
				node: resolvePath(projectRootDir, 'src/node/index.ts'),
				'jsx-runtime': resolvePath(projectRootDir, 'src/runtime/jsx-runtime.ts'),
				'jsx-dev-runtime': resolvePath(projectRootDir, 'src/runtime/jsx-dev-runtime.ts'),
				plugin: resolvePath(projectRootDir, 'src/plugin/index.ts'),
			},
			formats: ['es', 'cjs'],
			fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
		},
		rollupOptions: {
			external: [
				'mutts', 'jsdom',
				'@babel/core', '@babel/types',
				'@babel/plugin-proposal-decorators',
				'@babel/plugin-transform-react-jsx',
				'@babel/plugin-transform-typescript',
				'vite', 'vite-plugin-dts',
				'node:path', 'node:url', 'node:async_hooks',
			],
		},
		outDir: 'dist',
		target: 'esnext',
		minify: false,
		sourcemap: true
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./tests/setup-mutts.ts'],
		globals: true,
		include: ['**/*.spec.{ts,tsx}'],
		resolveSnapshotPath: (testPath, snapExtension) => testPath + snapExtension,
	}
})

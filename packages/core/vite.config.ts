import { defineConfig } from 'vitest/config'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pounceCorePackage } from '@pounce/plugin/packages'

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
			'npc-script': resolvePath(projectRootDir, '../../../npcs/src'),
			'omni18n': resolvePath(projectRootDir, '../../../omni18n/src'),
			'pure-glyf': resolvePath(projectRootDir, '../../../pure-glyf/src'),
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
				rollupTypes: false,
				copyDtsFiles: true,
				include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.d.ts'],
				beforeWriteFile: (filePath, content) => {
					// Inject JSX types reference into main index.d.ts
					if (filePath.endsWith('dist/index.d.ts')) {
						const reference = '/// <reference path="./types/jsx.d.ts" />\n'
						if (!content.includes(reference)) {
							return { filePath, content: reference + content }
						}
					}
					return { filePath, content }
				}
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
			},
			formats: ['es', 'cjs'],
			fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
		},
		rollupOptions: {
			external: ['mutts', 'jsdom', '@babel/core', 'node:path', 'node:url', 'node:async_hooks'],
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

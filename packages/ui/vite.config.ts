import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { pounceCorePlugin } from '@pounce/core/plugin'

const isWatch = process.argv.includes('--watch')

function ensureStableTypeEntrypoints() {
	const distDir = resolve(__dirname, 'dist')
	const entrypoints = [
		['index.d.ts', "export * from '../src/index'\n"],
		['dockview.d.ts', "export * from '../src/dockview'\n"],
		['models/index.d.ts', "export * from '../../src/models/index'\n"],
	]
	return {
		name: 'ensure-stable-type-entrypoints',
		buildStart() {
			mkdirSync(distDir, { recursive: true })
			for (const [file, content] of entrypoints) {
				const target = resolve(distDir, file)
				mkdirSync(dirname(target), { recursive: true })
				if (!existsSync(target)) writeFileSync(target, content)
			}
		},
	}
}

export default defineConfig({
	build: {
		lib: {
			entry: {
				dockview: resolve(__dirname, 'src/dockview.ts'),
				index: resolve(__dirname, 'src/index.ts'),
				models: resolve(__dirname, 'src/models/index.ts'),
			},
			formats: ['es'],
		},
		sourcemap: true,
		emptyOutDir: !isWatch,
		rollupOptions: {
			external: [/^@pounce\//, /^dockview-core/, /^mutts/],
		},
	},
	plugins: [
		...(isWatch ? [ensureStableTypeEntrypoints()] : []),
		pounceCorePlugin(),
		dts({
			include: ['src/**/*.ts', 'src/**/*.tsx'],
			exclude: ['src/**/*.spec.ts', 'src/**/*.spec.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
		}),
	],
	// For demo/e2e development: resolve @pounce/ui to source instead of dist
	resolve: {
		alias: {
			'@pounce/ui/dockview': resolve(__dirname, 'src/dockview.ts'),
			'@pounce/ui': resolve(__dirname, 'src/index.ts'),
			'@pounce/core': resolve(__dirname, '../core/src/dom/index.ts'),
			'@pounce/kit/intl': resolve(__dirname, '../kit/src/intl.tsx'),
			'@pounce/kit': resolve(__dirname, '../kit/src/dom/index.ts'),
			'mutts': resolve(__dirname, '../../../mutts/src/index.ts'),
		},
	},
})

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
	plugins: [
		dts({
			include: ['src'],
			exclude: ['demo'],
			outputDir: 'dist',
			rollupTypes: true,
		}),
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'PounceAdapterPico',
			formats: ['es', 'cjs'],
			fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
		},
		rollupOptions: {
			external: ['@pounce/core', '@pounce/ui', '@picocss/pico'],
		},
	},
	resolve: {
		alias: {
			'@pounce/core': resolve(__dirname, '../../core/src'),
			'@pounce/ui': resolve(__dirname, '../../ui/src'),
		},
	},
})

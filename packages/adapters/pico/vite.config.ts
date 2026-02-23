import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
	plugins: [
		dts({
			include: ['src'],
			exclude: ['demo'],
			outDir: 'dist',
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
		sourcemap: true,
		rollupOptions: {
			external: [/^@pounce\//, /^mutts/, /^pure-glyf/, '@picocss/pico', 'arktype'],
		},
	},
})

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
	build: {
		lib: {
			entry: {
				index: resolve(__dirname, 'src/index.ts'),
			},
			formats: ['es'],
		},
		rollupOptions: {
			external: [/^@pounce\/core/, /^mutts/],
		},
	},
	plugins: [
		dts({
			include: ['src/**/*.ts', 'src/**/*.tsx'],
			exclude: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
		}),
	],
})

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
	plugins: [
		dts({ rollupTypes: true })
	],
	build: {
		lib: {
			entry: 'src/index.ts',
			formats: ['es', 'cjs'],
			fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`
		},
		rollupOptions: {
			external: [
				/^@pounce\/core/,
				/^@pounce\/ui/,
				'@picocss/pico',
				/^@picocss\/pico\//
			]
		},
		sourcemap: true,
		minify: false
	}
})

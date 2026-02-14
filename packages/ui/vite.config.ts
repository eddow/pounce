import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'node:url'
import { pounceCorePackage } from '@pounce/core/plugin'
import { pounceUIPlugin } from './vite-plugin-pounce-ui'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    pounceUIPlugin(),
    ...pounceCorePackage({
      core: {
        jsxRuntime: {
          runtime: 'automatic',
          importSource: '@pounce/core',
        },
      },
      dts: {
        rollupTypes: true,
      }
    }),
  ],
  esbuild: false,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@pounce/ui',
      formats: ['es', 'cjs'],
      fileName: 'index'
    },
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: [
        /^@pounce\/core/,
        /^@pounce\/kit/,
        'mutts',
        'dockview-core',
        'pure-glyf'
      ],
    }
  }
})

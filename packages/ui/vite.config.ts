import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'node:url'
import { pounceCorePackage } from '@pounce/core/plugin'
import { pounceUIPlugin } from './vite-plugin-pounce-ui'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
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
    pounceUIPlugin()
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PounceUI',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        /^@pounce\/core/,
        /^@pounce\/kit/,
        'mutts',
        'dockview-core',
        'pure-glyf'
      ],
      output: {
        // preserveModules: true, // Optional: for better tree-shaking
        // preserveModulesRoot: 'src'
      }
    }
  }
})

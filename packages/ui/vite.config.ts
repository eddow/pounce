import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'node:url'
import { pounceUIPackage } from '@pounce/plugin/packages'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    ...pounceUIPackage({
      ui: {
        core: {
          jsxRuntime: {
            runtime: 'automatic',
            importSource: '@pounce/core',
          },
        }
      }
    })
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

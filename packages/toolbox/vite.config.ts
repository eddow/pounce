/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'node:url'
import dts from 'vite-plugin-dts'

const projectRootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      compilerOptions: {
        preserveSymlinks: false,
      }
    })
  ],
  build: {
    lib: {
      entry: {
        'dom': resolve(__dirname, 'src/dom.ts'),
        'no-dom': resolve(__dirname, 'src/no-dom.ts')
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'mutts',
        '@pounce/core',
        '#browser' // Internal alias, resolved by plugin? No, handled by Resolve?
        // Actually, aliases are resolved by Vite during build. 
        // We should NOT exclude #browser if it's internal source.
        // It will be bundled into the output.
      ]
    }
  },
  resolve: {
    alias: {
      // mutts: resolve(projectRootDir, '../../../mutts/src'),
    }
  }
})

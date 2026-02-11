import { defineConfig } from 'vite'
import { resolve } from 'path'
import { pounceCorePackage } from '@pounce/core/plugin'

export default defineConfig({
  root: resolve(import.meta.dirname, '.'),
  plugins: [
    ...pounceCorePackage({
      core: {
        jsxRuntime: {
          runtime: 'automatic',
          importSource: '@pounce/core',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@pounce/core/jsx-runtime': resolve(import.meta.dirname, '../core/src/runtime/jsx-runtime.ts'),
      '@pounce/core/jsx-dev-runtime': resolve(import.meta.dirname, '../core/src/runtime/jsx-dev-runtime.ts'),
      '@pounce/core': resolve(import.meta.dirname, '../core/src'),
      '@pounce/kit': resolve(import.meta.dirname, '../kit/src'),
      '@pounce/ui': resolve(import.meta.dirname, '../ui/src'),
      '@pounce/adapter-pico': resolve(import.meta.dirname, '../adapters/pico/src'),
      'mutts': resolve(import.meta.dirname, '../../../mutts/src'),
    },
  },
  server: {
    port: 5290,
    fs: {
      allow: [resolve(import.meta.dirname, '../../..')],
    },
  },
})

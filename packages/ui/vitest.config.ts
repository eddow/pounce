import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

const __dirname = new URL('.', import.meta.url).pathname

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup-mutts.ts'],
    include: ['tests/unit/**/*.spec.{ts,tsx}'],
    alias: {
      '@pounce/core/jsx-dev-runtime': resolve(__dirname, '../core/src/runtime/jsx-dev-runtime.ts'),
      '@pounce/core/jsx-runtime': resolve(__dirname, '../core/src/runtime/jsx-runtime.ts'),
      '@pounce/core': resolve(__dirname, '../core/src/index.ts'),
      '@pounce/kit/dom': resolve(__dirname, '../kit/src/dom/index.ts'),
      '@pounce/kit': resolve(__dirname, '../kit/src/index.ts'),
      'mutts': resolve(__dirname, '../../../mutts/src/index.ts'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/'
      ]
    }
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@pounce/core',
  },
  resolve: {
    conditions: ['browser', 'development'],
  },
})

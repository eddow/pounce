import { defineConfig } from 'vite'
import { resolve } from 'path'
import { pounceBarrelPlugin, pounceMinimalPackage } from '@pounce/core/plugin'

export default defineConfig({
  root: resolve(import.meta.dirname, '.'),
  plugins: [
    ...pounceMinimalPackage(),
    pounceBarrelPlugin({ skeleton: 'front-end', adapter: '@pounce/adapter-pico' }),
  ],
  resolve: {
    alias: {
      '@pounce/core': resolve(import.meta.dirname, '../core/src'),
      '@pounce/kit': resolve(import.meta.dirname, '../kit/src'),
      '@pounce/ui': resolve(import.meta.dirname, '../ui/src'),
      '@pounce/adapter-pico': resolve(import.meta.dirname, '../adapters/pico/src'),
      'mutts': resolve(import.meta.dirname, '../../../mutts/src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        if (warning.message?.includes('node:async_hooks')) return
        warn(warning)
      },
    },
  },
  server: {
    port: 5290,
    fs: {
      allow: [resolve(import.meta.dirname, '../../..')],
    },
  },
})

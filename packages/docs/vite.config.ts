import { defineConfig } from 'vite'
import { resolve } from 'path'
import { sursautBarrelPlugin, sursautMinimalPackage } from '@sursaut/core/plugin'

export default defineConfig({
  root: resolve(import.meta.dirname, '.'),
  plugins: [
    ...sursautMinimalPackage(),
    sursautBarrelPlugin({ skeleton: 'front-end', adapter: '@sursaut/adapter-pico' }),
  ],
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

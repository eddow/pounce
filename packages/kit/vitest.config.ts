import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    resolveSnapshotPath: (testPath, snapExtension) => testPath + snapExtension,
  },
  resolve: {
    conditions: ['browser', 'development'],
  },
})
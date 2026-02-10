import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'plugin',
    environment: 'node',
    include: ['**/*.spec.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})

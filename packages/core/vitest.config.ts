import { defineConfig, mergeConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { createBaseConfig } from '../../test/test-base.config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const baseConfig = createBaseConfig(__dirname)

const isBrowser = process.env.TEST_ENV === 'browser'

export default mergeConfig(baseConfig, defineConfig({
  test: {
    name: 'core',
    environment: 'jsdom',
    exclude: isBrowser
      ? ['**/node_modules/**', '**/dist/**', '**/SSRIsolation*']
      : ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    conditions: ['browser', 'development', 'import', 'default'],
  },
}))

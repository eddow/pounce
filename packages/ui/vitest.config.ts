import { defineConfig, mergeConfig } from 'vitest/config'
import { createBaseConfig } from '../../test/vitest.config.base'

const __dirname = new URL('.', import.meta.url).pathname

const baseConfig = createBaseConfig(__dirname)

export default mergeConfig(baseConfig, defineConfig({
  test: {
    environment: 'jsdom',
  },
}))

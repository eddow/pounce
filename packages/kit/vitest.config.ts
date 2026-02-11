import { defineConfig, mergeConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { createBaseConfig } from '../../test/test-base.config'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const baseConfig = createBaseConfig(__dirname)

export default mergeConfig(baseConfig, defineConfig({
  test: {
    name: 'kit',
    environment: 'jsdom',
  },
}))
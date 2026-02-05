import { defineConfig, mergeConfig } from 'vitest/config'
import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBaseConfig } from '../../test/vitest.config.base'

const projectRootDir = dirname(fileURLToPath(import.meta.url))

const baseConfig = createBaseConfig(projectRootDir)

export default mergeConfig(baseConfig, defineConfig({
  resolve: {
    conditions: ['browser', 'development', 'import', 'default'],
  },
  test: {
    environment: 'jsdom'
  },
}))

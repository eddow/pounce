import { defineConfig, mergeConfig } from "vitest/config";
import { createBaseConfig } from '../../test/vitest.config.base';

const baseConfig = createBaseConfig(__dirname);

export default mergeConfig(baseConfig, defineConfig({
  test: {
    environment: "node",
  },
}));

import { defineConfig, mergeConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { createBaseConfig } from '../../test/test-base.config';
var __dirname = fileURLToPath(new URL('.', import.meta.url));
var baseConfig = createBaseConfig(__dirname);
export default mergeConfig(baseConfig, defineConfig({
    test: {
        name: 'ui',
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
    },
}));

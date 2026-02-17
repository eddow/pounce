import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { pounceCorePlugin } from '@pounce/core/plugin';

export default defineConfig({
  plugins: [
    pounceCorePlugin(),
    dts({
      insertTypesEntry: true,
      beforeWriteFile(filePath, content) {
        return {
          filePath,
          content: content
            .replace(/from\s+['"]\.\.[\/\w.-]*\/ui\/dist[\/\w.-]*['"]/g, "from '@pounce/ui'")
            .replace(/from\s+['"]\.\.[\/\w.-]*\/core\/dist[\/\w.-]*['"]/g, "from '@pounce/core'")
        }
      }
    })
  ],
  build: {
    lib: {
      entry: {
        index: './src/index.ts',
        plugin: './src/plugin.ts',
        inject: './src/inject.ts',
        generator: './src/generator.ts',
        pounce: './src/pounce.tsx',
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vite', 'node:fs', 'node:path', /^@pounce\/core/, /^@pounce\/ui/]
    },
    sourcemap: 'inline'
  }
});

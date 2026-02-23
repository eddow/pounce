/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'node:url'
import { pounceCorePackage } from '@pounce/core/plugin'

const projectRootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    ...pounceCorePackage({
      core: {
        projectRoot: projectRootDir,
      },
      dts: {
        rollupTypes: false,
        insertTypesEntry: true,
        compilerOptions: {
          preserveSymlinks: false,
        }
      }
    }),
  ],
  esbuild: false,
  build: {
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(projectRootDir, 'src/index.ts'),
        dom: resolve(projectRootDir, 'src/dom/index.ts'),
        node: resolve(projectRootDir, 'src/node/index.ts'),
        models: resolve(projectRootDir, 'src/models.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'mutts',
        /^@pounce\//,
        'jsdom',
        'arktype',
        'node:async_hooks',
        /^node:/,
      ]
    }
  },
})

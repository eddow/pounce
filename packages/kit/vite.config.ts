/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'node:url'
import { pounceCorePackage } from '@pounce/plugin/packages'

const projectRootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    ...pounceCorePackage({
      core: {
        projectRoot: projectRootDir,
        jsxRuntime: {
          runtime: 'automatic',
          importSource: '@pounce/core',
        },
      },
      dts: {
        insertTypesEntry: true,
        compilerOptions: {
          preserveSymlinks: false,
        }
      }
    }),
  ],
  esbuild: false,
  build: {
    lib: {
      entry: {
        index: resolve(projectRootDir, 'src/index.ts'),
        dom: resolve(projectRootDir, 'src/dom/index.ts'),
        node: resolve(projectRootDir, 'src/node/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'mutts',
        '@pounce/core',
        '@pounce/core/server',
        'jsdom',
        'arktype',
        'node:async_hooks',
        /^node:/,
      ]
    }
  },
  resolve: {
    alias: {
      '@pounce/core/jsx-runtime': resolve(projectRootDir, '../core/src/runtime/jsx-runtime.ts'),
      '@pounce/core/jsx-dev-runtime': resolve(projectRootDir, '../core/src/runtime/jsx-dev-runtime.ts'),
    }
  }
})

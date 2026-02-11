import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { pounceCorePlugin } from '../core/src/plugin/index'

const rootDir = resolve(__dirname, '..')
const boardDir = __dirname

export default defineConfig({
  plugins: [
    pounceCorePlugin({
      projectRoot: boardDir,
      jsxRuntime: {
        runtime: 'automatic',
        importSource: '@pounce/core',
      },
    }),
  ],
  esbuild: false,
  resolve: {
    alias: {
      'pounce-ts/jsx-runtime': resolve(boardDir, '../core/src/runtime/jsx-runtime.ts'),
      'pounce-ts/jsx-dev-runtime': resolve(boardDir, '../core/src/runtime/jsx-dev-runtime.ts'),
      'pounce-ts/server': resolve(boardDir, '../core/src/node/index.ts'),
      'pounce-ts': resolve(boardDir, '../core/src'),
      'pounce-ui': resolve(boardDir, '../ui/src'),
      '@pounce/kit': resolve(boardDir, '../kit/src'),
      'mutts': resolve(rootDir, '../../../mutts/src'),
      'npc-script': resolve(rootDir, '../../../npcs/src'),
      'omni18n': resolve(rootDir, '../../../omni18n/src'),
      'pounce-board/client': resolve(boardDir, 'src/client'),
      'pounce-board/server': resolve(boardDir, 'src/server'),
      'pounce-board': resolve(boardDir, 'src'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(boardDir, 'src/index.ts'),
        client: resolve(boardDir, 'src/client/index.ts'),
        server: resolve(boardDir, 'src/server/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'mutts',
        /^@pounce\/core/,
        /^@pounce\/kit/,
        /^@pounce\/ui/,
        'hono',
        '@hono/node-server',
        'zod',
        'cac',
        'node:async_hooks',
        'node:fs',
        'node:path',
        'node:module',
        'node:url',
        'node:process',
      ],
      output: {
        preserveModules: true,
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
    target: 'esnext',
    emptyOutDir: true,
  },
})

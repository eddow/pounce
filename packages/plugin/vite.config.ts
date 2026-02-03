import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'node:url'
import dts from 'vite-plugin-dts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: false,
      compilerOptions: {
        preserveSymlinks: false,
      }
    })
  ],
  build: {
    lib: {
      entry: {
        'core/index': resolve(__dirname, 'src/core/index.ts'),
        'ui/index': resolve(__dirname, 'src/ui/index.ts'),
        'kit/index': resolve(__dirname, 'src/kit/index.ts'),
        'configs/index': resolve(__dirname, 'src/configs/index.ts'),
        'packages/index': resolve(__dirname, 'src/packages/index.ts'),
      },
      formats: ['es']
    },
    rollupOptions: {
      external: [
        '@babel/core',
        '@babel/types',
        '@babel/plugin-proposal-decorators',
        '@babel/plugin-transform-react-jsx',
        '@babel/plugin-transform-typescript',
        'vite',
        'vite-plugin-dts',
        'node:path',
        'node:url'
      ],
      output: {
        preserveModules: false,
        entryFileNames: '[name].js'
      }
    }
  }
})

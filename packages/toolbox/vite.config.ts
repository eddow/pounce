import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      compilerOptions: {
        preserveSymlinks: false,
      }
    })
  ],
  build: {
    lib: {
      entry: {
        'entry-dom': resolve(__dirname, 'src/entry-dom.ts'),
        'entry-no-dom': resolve(__dirname, 'src/entry-no-dom.ts')
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'mutts',
        '@pounce/core',
        '#browser' // Internal alias, resolved by plugin? No, handled by Resolve?
        // Actually, aliases are resolved by Vite during build. 
        // We should NOT exclude #browser if it's internal source.
        // It will be bundled into the output.
      ]
    }
  },
  resolve: {
    alias: {
      // Vite doesn't automatically read imports field from package.json for internal resolution in development?
      // Check if we need explicit alias here.
      // '#browser': resolve(__dirname, './src/no-dom/browser.ts') // Default?
      // Wait, we want separate builds?
      // The current config builds BOTH entries in ONE pass.
      // But one needs DOM and one needs Node.
      // Vite build is usually for Browser (ESM).
      // Node build logic is tricky with single Vite config unless we use environment config or multiple inputs?
    }
  }
})

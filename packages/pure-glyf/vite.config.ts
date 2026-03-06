import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pounceCorePlugin } from '@pounce/core/plugin';

const isWatch = process.argv.includes('--watch');

function ensureStableTypeEntrypoints() {
  const distDir = resolve(import.meta.dirname, 'dist');
  const entrypoints = [
    ['index.d.ts', "export * from '../src/index'\n"],
    ['plugin.d.ts', "export * from '../src/plugin'\n"],
    ['inject.d.ts', "export * from '../src/inject'\n"],
    ['generator.d.ts', "export * from '../src/generator'\n"],
    ['pounce.d.ts', "export * from '../src/pounce'\n"],
  ];
  return {
    name: 'ensure-stable-type-entrypoints',
    buildStart() {
      mkdirSync(distDir, { recursive: true });
      for (const [file, content] of entrypoints) {
        const target = resolve(distDir, file);
        mkdirSync(dirname(target), { recursive: true });
        if (!existsSync(target)) writeFileSync(target, content);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    ...(isWatch ? [ensureStableTypeEntrypoints()] : []),
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
    emptyOutDir: !isWatch,
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

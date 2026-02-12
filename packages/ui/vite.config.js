var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'node:url';
import { pounceCorePackage } from '@pounce/core/plugin';
import { pounceUIPlugin } from './vite-plugin-pounce-ui';
var __dirname = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
    plugins: __spreadArray(__spreadArray([], pounceCorePackage({
        core: {
            jsxRuntime: {
                runtime: 'automatic',
                importSource: '@pounce/core',
            },
        },
        dts: {
            rollupTypes: true,
        }
    }), true), [
        pounceUIPlugin()
    ], false),
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'PounceUI',
            formats: ['es'],
            fileName: 'index'
        },
        rollupOptions: {
            external: [
                /^@pounce\/core/,
                /^@pounce\/kit/,
                'mutts',
                'dockview-core',
                'pure-glyf'
            ],
            output: {
            // preserveModules: true, // Optional: for better tree-shaking
            // preserveModulesRoot: 'src'
            }
        }
    }
});

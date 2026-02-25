import { defineConfig } from 'vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pounceCorePackage } from '../../../core/src/plugin/index'

const projectRootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	root: resolve(projectRootDir),
	plugins: [
		...pounceCorePackage({
			core: {
				projectRoot: resolve(projectRootDir, '../../../../'),
			}
		}),
	],
	resolve: {
		alias: {
			'@pounce/ui/internal': resolve(projectRootDir, '../../src/index.ts'),
			'@pounce/ui': resolve(projectRootDir, '../../src/index.ts'),
		},
	},
	server: {
		fs: {
			allow: [resolve(projectRootDir, '../../../../')],
		},
	},
})

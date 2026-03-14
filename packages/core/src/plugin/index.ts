import { type PluginItem, transformSync } from '@babel/core'
import babelPluginDecorators from '@babel/plugin-proposal-decorators'
import babelPluginJsx from '@babel/plugin-transform-react-jsx'
import babelPluginTs from '@babel/plugin-transform-typescript'
import dts, { type PluginOptions as DtsPluginOptions } from 'vite-plugin-dts'
import { sursautBabelPlugin, sursautSpreadPlugin } from './babel'
import { sursautBarrelPlugin } from './barrel'

export { sursautBabelPlugin, sursautSpreadPlugin }
export { sursautBarrelPlugin }
export type { BarrelSkeleton, SursautBarrelPluginOptions } from './barrel'

export interface DtsConfigOptions {
	insertTypesEntry?: boolean
	rollupTypes?: boolean
	copyDtsFiles?: boolean
	include?: string[]
	exclude?: string[]
	compilerOptions?: DtsPluginOptions['compilerOptions']
	beforeWriteFile?: DtsPluginOptions['beforeWriteFile']
	afterBuild?: DtsPluginOptions['afterBuild']
}

export function createStandardDtsPlugin(options: DtsConfigOptions = {}) {
	return dts({
		insertTypesEntry: options.insertTypesEntry ?? true,
		rollupTypes: options.rollupTypes ?? false,
		copyDtsFiles: options.copyDtsFiles,
		include: options.include,
		exclude: options.exclude ?? [
			'**/*.spec.ts',
			'**/*.spec.tsx',
			'**/*.test.ts',
			'**/*.test.tsx',
			'**/node_modules/**',
			'**/mutts/**',
		],
		compilerOptions: {
			preserveSymlinks: false,
			composite: false,
			...options.compilerOptions,
		},
		beforeWriteFile: options.beforeWriteFile,
		afterBuild: options.afterBuild,
	})
}

export interface SursautBabelPluginsOptions {
	isTSX: boolean
	onlyRemoveTypeImports?: boolean
}

export function createSursautBabelPlugins(options: SursautBabelPluginsOptions): PluginItem[] {
	return [
		[sursautBabelPlugin],
		[babelPluginDecorators, { version: '2023-05' }],
		[
			babelPluginJsx,
			{
				runtime: 'classic',
				pragma: 'h',
				pragmaFrag: 'Fragment',
				throwIfNamespace: false,
			},
		],
		[
			babelPluginTs,
			{
				isTSX: options.isTSX,
				allowDeclareFields: true,
				onlyRemoveTypeImports: options.onlyRemoveTypeImports,
			},
		],
	]
}

export interface SursautCorePluginOptions {
	projectRoot?: string
	onlyRemoveTypeImports?: boolean
}

/**
 * Standard Vite plugin for Sursaut JSX transformation
 */
export function sursautCorePlugin(options: SursautCorePluginOptions = {}) {
	const resolvedOptions = {
		onlyRemoveTypeImports: true,
		...options,
	}
	return {
		name: 'sursaut-core',
		enforce: 'pre' as const,
		async transform(code: string, id: string, inMap: any) {
			if (id.startsWith('\0') || id.includes('?')) return null
			if (!/\.(tsx?|jsx?)$/.test(id)) return null
			if (id.includes('node_modules') && !id.includes('/sursaut/packages/')) return null
			if (/(^|\/)dist\//.test(id)) return null

			const result = transformSync(code, {
				filename: id,
				cwd: resolvedOptions.projectRoot,
				babelrc: false,
				configFile: false,
				plugins: createSursautBabelPlugins({
					onlyRemoveTypeImports: resolvedOptions.onlyRemoveTypeImports,
					isTSX: id.endsWith('.tsx'),
				}),
				sourceFileName: id,
				inputSourceMap: inMap && typeof inMap === 'object' && inMap.mappings ? inMap : undefined,
				sourceMaps: true,
			})

			if (!result || !result.code) return null

			const spreadResult = transformSync(result.code, {
				filename: id,
				cwd: resolvedOptions.projectRoot,
				babelrc: false,
				configFile: false,
				plugins: [[sursautSpreadPlugin]],
				sourceFileName: id,
				inputSourceMap:
					result.map && typeof result.map === 'object' && 'mappings' in result.map
						? result.map
						: undefined,
				sourceMaps: true,
			})

			if (!spreadResult || !spreadResult.code) return null
			return { code: spreadResult.code, map: spreadResult.map ?? undefined }
		},
	}
}

export interface CorePackageOptions {
	core?: SursautCorePluginOptions
	dts?: DtsConfigOptions
}

/**
 * Core package: JSX transformation + TypeScript declarations
 * Perfect for libraries that need reactive JSX but no UI styling
 */
export function sursautCorePackage(options: CorePackageOptions = {}) {
	const { core: coreOptions = {}, dts: dtsOptions = {} } = options

	return [sursautCorePlugin(coreOptions), createStandardDtsPlugin(dtsOptions)]
}

/**
 * Minimal package: Just JSX transformation
 * Perfect for simple projects that only need reactive JSX
 */
export function sursautMinimalPackage(options: Partial<SursautCorePluginOptions> = {}) {
	return [sursautCorePlugin(options)]
}

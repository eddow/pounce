import { type PluginItem, transformSync } from '@babel/core'
import dts, { type PluginOptions as DtsPluginOptions } from 'vite-plugin-dts'
import { pounceBabelPlugin } from './babel'
import { pounceBarrelPlugin } from './barrel'

export { pounceBabelPlugin }
export { pounceBarrelPlugin }
export type { BarrelSkeleton, PounceBarrelPluginOptions } from './barrel'

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
		exclude: options.exclude ?? ['**/node_modules/**', '**/mutts/**'],
		compilerOptions: {
			preserveSymlinks: false,
			composite: false,
			...options.compilerOptions,
		},
		beforeWriteFile: options.beforeWriteFile,
		afterBuild: options.afterBuild,
	})
}

export interface PounceBabelPluginsOptions {
	isTSX: boolean
	onlyRemoveTypeImports?: boolean
}

export function createPounceBabelPlugins(options: PounceBabelPluginsOptions): PluginItem[] {
	return [
		[pounceBabelPlugin],
		['@babel/plugin-proposal-decorators', { version: '2023-05' }],
		[
			'@babel/plugin-transform-react-jsx',
			{
				runtime: 'classic',
				pragma: 'h',
				pragmaFrag: 'Fragment',
				throwIfNamespace: false,
			},
		],
		[
			'@babel/plugin-transform-typescript',
			{
				isTSX: options.isTSX,
				allowDeclareFields: true,
				onlyRemoveTypeImports: options.onlyRemoveTypeImports,
			},
		],
	]
}

export interface PounceCorePluginOptions {
	projectRoot?: string
	onlyRemoveTypeImports?: boolean
}

/**
 * Standard Vite plugin for Pounce JSX transformation
 */
export function pounceCorePlugin(options: PounceCorePluginOptions = {}) {
	const resolvedOptions = {
		onlyRemoveTypeImports: true,
		...options,
	}
	return {
		name: 'pounce-core',
		enforce: 'pre' as const,
		async transform(code: string, id: string, inMap: any) {
			if (id.startsWith('\0') || id.includes('?')) return null
			if (!/\.(tsx?|jsx?)$/.test(id)) return null
			if (id.includes('node_modules') && !id.includes('/pounce/packages/')) return null

			const result = transformSync(code, {
				filename: id,
				cwd: resolvedOptions.projectRoot,
				babelrc: false,
				configFile: false,
				plugins: createPounceBabelPlugins({
					onlyRemoveTypeImports: resolvedOptions.onlyRemoveTypeImports,
					isTSX: id.endsWith('.tsx'),
				}),
				sourceFileName: id,
				inputSourceMap: inMap && typeof inMap === 'object' && inMap.mappings ? inMap : undefined,
				sourceMaps: true,
			})

			if (!result || !result.code) return null
			return { code: result.code, map: result.map ?? undefined }
		},
	}
}

export interface CorePackageOptions {
	core?: PounceCorePluginOptions
	dts?: DtsConfigOptions
}

/**
 * Core package: JSX transformation + TypeScript declarations
 * Perfect for libraries that need reactive JSX but no UI styling
 */
export function pounceCorePackage(options: CorePackageOptions = {}) {
	const { core: coreOptions = {}, dts: dtsOptions = {} } = options

	return [pounceCorePlugin(coreOptions), createStandardDtsPlugin(dtsOptions)]
}

/**
 * Minimal package: Just JSX transformation
 * Perfect for simple projects that only need reactive JSX
 */
export function pounceMinimalPackage(options: Partial<PounceCorePluginOptions> = {}) {
	return [pounceCorePlugin(options)]
}

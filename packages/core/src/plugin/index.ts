import { transformSync, type PluginItem } from '@babel/core'
import dts, { type PluginOptions as DtsPluginOptions } from 'vite-plugin-dts'
import { pounceBabelPlugin } from './babel'

export { pounceBabelPlugin }

export interface DtsConfigOptions {
	insertTypesEntry?: boolean
	rollupTypes?: boolean
	copyDtsFiles?: boolean
	include?: string[]
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
		compilerOptions: {
			preserveSymlinks: false,
			...options.compilerOptions,
		},
		beforeWriteFile: options.beforeWriteFile,
		afterBuild: options.afterBuild,
	})
}

export interface JsxRuntimeConfig {
	runtime: 'automatic'
	importSource: string
}

export interface PounceBabelPluginsOptions {
	projectRoot?: string
	jsxRuntime: JsxRuntimeConfig
	isTSX: boolean
	onlyRemoveTypeImports?: boolean
}

export function createPounceBabelPlugins(options: PounceBabelPluginsOptions): PluginItem[] {
	const { jsxRuntime } = options

	return [
		[pounceBabelPlugin, { projectRoot: options.projectRoot }],
		['@babel/plugin-proposal-decorators', { version: '2023-05' }],
		[
			'@babel/plugin-transform-react-jsx',
			{
				runtime: 'automatic',
				importSource: jsxRuntime.importSource,
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
	jsxRuntime?: JsxRuntimeConfig
	onlyRemoveTypeImports?: boolean
}

/**
 * Standard Vite plugin for Pounce JSX transformation
 */
export function pounceCorePlugin(options: PounceCorePluginOptions = {}) {
	const resolvedOptions = {
		jsxRuntime: {
			runtime: 'automatic' as const,
			importSource: '@pounce/core',
		},
		onlyRemoveTypeImports: true,
		...options,
	}
	return {
		name: 'pounce-core',
		enforce: 'pre' as const,
		async transform(code: string, id: string) {
			if (id.startsWith('\0') || id.includes('?')) return null
			if (!/\.(tsx?|jsx?)$/.test(id)) return null
			if (id.includes('node_modules')) return null

			const result = transformSync(code, {
				filename: id,
				cwd: resolvedOptions.projectRoot,
				babelrc: false,
				configFile: false,
				plugins: createPounceBabelPlugins({
					...resolvedOptions,
					isTSX: id.endsWith('.tsx'),
				}),
				sourceMaps: true,
			})

			if (!result) return null
			return { code: result.code || '', map: result.map ?? undefined }
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

	return [
		pounceCorePlugin(coreOptions),
		createStandardDtsPlugin(dtsOptions),
	]
}

/**
 * Minimal package: Just JSX transformation
 * Perfect for simple projects that only need reactive JSX
 */
export function pounceMinimalPackage(options: Partial<PounceCorePluginOptions> = {}) {
	return [pounceCorePlugin(options)]
}

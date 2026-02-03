import type { Plugin } from 'vite'
import { pounceCorePlugin, type PounceCorePluginOptions, createStandardDtsPlugin, type DtsConfigOptions } from '../configs/index'
import { pounceUIPlugin } from '../ui/index'

export interface CorePackageOptions {
	core?: PounceCorePluginOptions
	dts?: DtsConfigOptions
}

export interface UIPackageOptions {
	ui?: CorePackageOptions
}

export interface ClientPackageOptions {
	client?: UIPackageOptions
	additional?: Plugin[]
}

/**
 * Core package: JSX transformation + TypeScript declarations
 * Perfect for libraries that need reactive JSX but no UI styling
 */
export function pounceCorePackage(options: CorePackageOptions = {}) {
	const { core: coreOptions = {}, dts: dtsOptions = {} } = options
	
	// Default core options for most use cases
	const defaultCoreOptions: PounceCorePluginOptions = {
		jsxRuntime: {
			runtime: 'automatic',
			importSource: '@pounce/core'
		},
		onlyRemoveTypeImports: true,
		...coreOptions
	}

	return [
		pounceCorePlugin(defaultCoreOptions),
		createStandardDtsPlugin(dtsOptions)
	]
}

/**
 * UI package: Core + UI styling validation
 * Perfect for UI component libraries that need styling validation
 */
export function pounceUIPackage(options: UIPackageOptions = {}) {
	const { ui: uiOptions = {} } = options
	
	return [
		...pounceCorePackage(uiOptions),
		pounceUIPlugin()
	]
}

/**
 * Client package: UI + additional client-side plugins
 * Perfect for client applications that need everything
 */
export function pounceClientPackage(options: ClientPackageOptions = {}) {
	const { client: clientOptions = {}, additional: additionalPlugins = [] } = options
	
	return [
		...pounceUIPackage(clientOptions),
		...additionalPlugins
	]
}

/**
 * Minimal package: Just JSX transformation
 * Perfect for simple projects that only need reactive JSX
 */
export function pounceMinimalPackage(options: Partial<PounceCorePluginOptions> = {}) {
	const defaultOptions: PounceCorePluginOptions = {
		jsxRuntime: {
			runtime: 'automatic',
			importSource: '@pounce/core'
		},
		onlyRemoveTypeImports: true,
		...options
	}

	return [pounceCorePlugin(defaultOptions)]
}

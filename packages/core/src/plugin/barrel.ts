import fs from 'node:fs'
import path from 'node:path'

export type BarrelSkeleton = 'kit' | 'front-end' | 'back-end' | 'full-stack'

export interface PounceBarrelPluginOptions {
	/** Virtual module name. Default: `"@pounce"` */
	name?: string
	/** Which packages to barrel. Default: `"full-stack"` */
	skeleton?: BarrelSkeleton
	/**
	 * UI adapter package to re-export (e.g. `"@pounce/adapter-pico"`).
	 * Required when skeleton includes UI (`front-end` or `full-stack`).
	 */
	adapter?: string
	/**
	 * Path to write the ambient `declare module` `.d.ts` file for IDE support.
	 * Defaults to `<name>.d.ts` (e.g. `@pounce.d.ts`) in the project root.
	 * Set to `false` to disable generation.
	 */
	dts?: string | false
}

function buildBarrelLines(options: Required<Omit<PounceBarrelPluginOptions, 'dts'>>): string[] {
	const { skeleton, adapter } = options
	const hasUI = skeleton === 'front-end' || skeleton === 'full-stack'
	const hasBoard = skeleton === 'back-end' || skeleton === 'full-stack'
	const kitEntry = hasUI ? `@pounce/kit/dom` : `@pounce/kit`

	const lines: string[] = []
	lines.push(`export * from '@pounce/core'`)
	lines.push(`export * from '${kitEntry}'`)
	if (hasUI) lines.push(`export * from '@pounce/ui'`)
	if (hasUI && adapter) lines.push(`export * from '${adapter}'`)
	if (hasBoard) lines.push(`export * from '@pounce/board'`)
	return lines
}

function buildBarrelSource(options: Required<Omit<PounceBarrelPluginOptions, 'dts'>>): string {
	return `${buildBarrelLines(options).join('\n')}\n`
}

function buildDts(name: string, options: Required<Omit<PounceBarrelPluginOptions, 'dts'>>): string {
	const inner = buildBarrelLines(options)
		.map((l) => `\t${l}`)
		.join('\n')
	return `declare module '${name}' {\n${inner}\n}\n`
}

/**
 * Vite plugin that creates a virtual barrel module aggregating Pounce packages.
 * Also writes an ambient `declare module` `.d.ts` file for IDE type support.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { pounceBarrelPlugin } from '@pounce/core/plugin'
 *
 * export default defineConfig({
 *   plugins: [
 *     pounceBarrelPlugin({
 *       skeleton: 'front-end',
 *       adapter: '@pounce/adapter-pico',
 *     }),
 *   ],
 * })
 * ```
 *
 * Then in your app:
 * ```ts
 * import { reactive, Button, A } from '@pounce'
 * ```
 */
export function pounceBarrelPlugin(options: PounceBarrelPluginOptions = {}) {
	const name = options.name ?? '@pounce'
	const resolved = {
		name,
		skeleton: options.skeleton ?? 'full-stack',
		adapter: options.adapter ?? '',
	} satisfies Required<Omit<PounceBarrelPluginOptions, 'dts'>>

	const dtsPath = options.dts === false ? false : (options.dts ?? `${name}.d.ts`)

	return {
		name: 'pounce-barrel',
		buildStart() {
			if (dtsPath) {
				const abs = path.resolve(process.cwd(), dtsPath)
				fs.mkdirSync(path.dirname(abs), { recursive: true })
				fs.writeFileSync(abs, buildDts(name, resolved))
			}
		},
		resolveId(id: string) {
			if (id === name) return id
			return null
		},
		load(id: string) {
			if (id === name) return buildBarrelSource(resolved)
			return null
		},
	}
}

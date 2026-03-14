import fs from 'node:fs'
import path from 'node:path'

export type BarrelSkeleton = 'kit' | 'front-end' | 'back-end' | 'full-stack'

export interface SursautBarrelPluginOptions {
	/** Virtual module name. Default: `"@sursaut"` */
	name?: string
	/** Which packages to barrel. Default: `"full-stack"` */
	skeleton?: BarrelSkeleton
	/**
	 * UI adapter package to re-export (e.g. `"@sursaut/adapter-pico"`).
	 * Required when skeleton includes UI (`front-end` or `full-stack`).
	 */
	adapter?: string
	/**
	 * Path to write the ambient `declare module` `.d.ts` file for IDE support.
	 * Defaults to `.generated-types/<name>.d.ts` (e.g. `.generated-types/@sursaut.d.ts`) in the project root.
	 * Set to `false` to disable generation.
	 */
	dts?: string | false
}

function buildBarrelLines(options: Required<Omit<SursautBarrelPluginOptions, 'dts'>>): string[] {
	const { skeleton, adapter } = options
	const hasUI = ['front-end', 'full-stack'].includes(skeleton)
	const hasBoard = ['back-end', 'full-stack'].includes(skeleton)

	const lines: string[] = []
	lines.push(hasUI ? `export * from '@sursaut/core/dom'` : `export * from '@sursaut/core'`)
	lines.push(hasUI ? `export * from '@sursaut/kit/dom'` : `export * from '@sursaut/kit'`)
	if (hasUI) {
		lines.push(`export * from '@sursaut/ui'`)
		if (adapter) lines.push(`export * from '${adapter}'`)
	}
	if (hasBoard) lines.push(`export * from '@sursaut/board'`)
	return lines
}

function buildBarrelSource(options: Required<Omit<SursautBarrelPluginOptions, 'dts'>>): string {
	return `${buildBarrelLines(options).join('\n')}\n`
}

function buildDts(
	name: string,
	options: Required<Omit<SursautBarrelPluginOptions, 'dts'>>
): string {
	const inner = buildBarrelLines(options)
		.map((l) => `\t${l}`)
		.join('\n')
	return `declare module '${name}' {\n${inner}\n}\n`
}

/**
 * Vite plugin that creates a virtual barrel module aggregating Sursaut packages.
 * Also writes an ambient `declare module` `.d.ts` file for IDE type support.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { sursautBarrelPlugin } from '@sursaut/core/plugin'
 *
 * export default defineConfig({
 *   plugins: [
 *     sursautBarrelPlugin({
 *       skeleton: 'front-end',
 *       adapter: '@sursaut/adapter-pico',
 *     }),
 *   ],
 * })
 * ```
 *
 * Then in your app:
 * ```ts
 * import { reactive, Button, A } from '@sursaut'
 * ```
 */
export function sursautBarrelPlugin(options: SursautBarrelPluginOptions = {}) {
	const name = options.name ?? '@sursaut'
	const resolved = {
		name,
		skeleton: options.skeleton ?? 'full-stack',
		adapter: options.adapter ?? '',
	} satisfies Required<Omit<SursautBarrelPluginOptions, 'dts'>>

	const dtsPath = options.dts === false ? false : (options.dts ?? `.generated-types/${name}.d.ts`)

	return {
		name: 'sursaut-barrel',
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

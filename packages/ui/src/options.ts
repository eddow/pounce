export type IconFactory = (name: string, size: string | number | undefined) => JSX.Element

/**
 * Global configuration for `@pounce/ui`.
 * Mutate properties directly — same pattern as `reactiveOptions` in mutts.
 *
 * @example
 * ```ts
 * import { options } from '@pounce/ui'
 * options.iconFactory = (name, size) => <i class={`icon-${name}`} />
 * ```
 */
export const options = {
	/**
	 * Renders an icon by name. Set once at app startup by the adapter.
	 * If unset, `<Icon>` falls back to `<span data-icon="name">name</span>`.
	 */
	iconFactory: undefined as IconFactory | undefined,
}

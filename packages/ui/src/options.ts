import type { DisplayContext } from '@sursaut/kit'

/**
 * Icon factory receives the `DisplayContext` from `@sursaut/kit` (injected into `env.dc`
 * by `DisplayProvider`). Carries direction (RTL/LTR), theme, locale, and timezone.
 */

export type IconFactory = (
	name: string,
	size: string | number | undefined,
	el: JSX.GlobalHTMLAttributes,
	context: DisplayContext
) => JSX.Element

/**
 * Global configuration for `@sursaut/ui`.
 * Mutate properties directly — same pattern as `reactiveOptions` in mutts.
 *
 * @example
 * ```ts
 * import { options } from '@sursaut/ui'
 * options.iconFactory = (name, size, el, dc) => <i class={`icon-${name}`} {...el} />
 * ```
 */
export const options = {
	/**
	 * Renders an icon by name. Set once at app startup by the adapter.
	 * If unset, `<Icon>` falls back to `<span data-icon="name">name</span>`.
	 */
	iconFactory: undefined as IconFactory | undefined,
}

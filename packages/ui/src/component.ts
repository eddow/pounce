import type { Env } from '@pounce/core'
import { isDev } from './shared/utils'

/** Props type with variant narrowed to the declared union V */
export type WithVariant<Props, V extends string> = Omit<Props, 'variant'> & { variant?: V }

/**
 * A component wrapped by `uiComponent`: callable as JSX + dot-syntax variant accessors.
 *
 * @example
 * ```tsx
 * <Button variant="primary" />
 * <Button.primary />   // equivalent
 * ```
 */
export type UiComponent<Props, V extends string> = ((
	props: WithVariant<Props, V>
) => JSX.Element) & {
	readonly [K in V]: (props: Omit<WithVariant<Props, V>, 'variant'>) => JSX.Element
}

/**
 * Curried component factory. Call with a `as const` variant list to get a wrapper
 * that adds variant typing and dot-syntax to any component constructor.
 *
 * The variant list is the single source of truth: it drives both the TypeScript type
 * and the dev-mode unknown-variant warning.
 *
 * @example
 * ```tsx
 * // Adapter creates a reusable factory for all its components:
 * const picoComponent = uiComponent(['primary', 'secondary', 'danger', 'ghost'] as const)
 *
 * // Each component is wrapped once:
 * export const Button = picoComponent(function Button(props) {
 *   return <button class={`btn btn-${props.variant ?? 'default'}`}>{props.children}</button>
 * })
 *
 * // Usage — both are equivalent:
 * <Button variant="primary">Save</Button>
 * <Button.primary>Save</Button.primary>
 * ```
 */
export function uiComponent<const V extends string>(
	variants: readonly V[]
): <Props extends { variant?: string }>(
	ctor: (props: WithVariant<Props, V>, env: Env) => JSX.Element
) => UiComponent<Props, V> {
	return function wrap<Props extends { variant?: string }>(
		ctor: (props: WithVariant<Props, V>, env: Env) => JSX.Element
	): UiComponent<Props, V> {
		const wrapped = (props: WithVariant<Props, V>, env: Env) => {
			if (
				isDev &&
				props.variant !== undefined &&
				!(variants as readonly string[]).includes(props.variant)
			) {
				// biome-ignore lint/suspicious/noConsole: dev-mode warning by design
				throw new Error(
					`[pounce/ui] <${ctor.name}> unknown variant "${props.variant}". Known: ${variants.join(', ')}`
				)
			}
			return ctor(props, env)
		}

		Object.defineProperty(wrapped, 'name', { value: ctor.name })

		return new Proxy(wrapped, {
			get(target, prop) {
				if (typeof prop === 'string' && (variants as readonly string[]).includes(prop)) {
					return (props: Omit<WithVariant<Props, V>, 'variant'>, env: Env) =>
						ctor({ ...props, variant: prop as V } as WithVariant<Props, V>, env)
				}
				return Reflect.get(target, prop)
			},
		}) as UiComponent<Props, V>
	}
}

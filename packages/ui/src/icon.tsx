import type { Env } from '@pounce/core'
import { options } from './options'
import { lift } from 'mutts'

export type IconComponentProps = {
	name: string
	size?: string | number
	el?: JSX.GlobalHTMLAttributes
}

/**
 * Renders an icon using the registered icon factory.
 * Falls back to a `<span data-icon>` if no factory is set.
 *
 * Must be used inside a Pounce component tree — receives `env` (DisplayContext)
 * automatically, which the icon factory can use for RTL/LTR and theme awareness.
 *
 * @example
 * ```tsx
 * <Icon name="star" size="1.5rem" />
 * ```
 */
export function Icon(props: IconComponentProps, env: Env): JSX.Element {
	if (!options.iconFactory) return <span data-icon={props.name}>{props.name}</span>
	return lift(()=> [options.iconFactory!(props.name, props.size, props.el ?? {}, env.dc)])
}

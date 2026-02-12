import type { Scope } from '@pounce/core'
import { getGlobalAdapter } from '../adapter/registry'


export type IconProps = {
	name: string
	size?: string | number
	class?: string
	el?: JSX.HTMLAttributes<any>
}

/**
 * Icon component that uses the global iconFactory from the adapter.
 * 
 * If no iconFactory is configured, renders the icon name as text (fallback).
 * 
 * @example
 * // With iconFactory configured
 * <Icon name="check" size={24} />
 * 
 * // Without iconFactory (fallback)
 * <Icon name="check" /> // Renders: <span class="pounce-icon">check</span>
 */
export const Icon = (props: IconProps, scope: Scope) => {
	const globalAdapter = getGlobalAdapter()


	if (globalAdapter.iconFactory) {
		return globalAdapter.iconFactory(props.name, props.size, scope)
	}

	return (
		<span
			class={['pounce-icon', props.class].filter(Boolean).join(' ')}
			{...props.el}
		>
			{props.name}
		</span>
	)
}

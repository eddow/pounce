import { options } from './options'

export type IconComponentProps = {
	name: string
	size?: string | number
}

/**
 * Renders an icon using the registered icon factory.
 * Falls back to a text node with the icon name if no factory is set.
 *
 * @example
 * ```tsx
 * <Icon name="star" size="1.5rem" />
 * ```
 */
export const Icon = (props: IconComponentProps): JSX.Element => {
	if (!options.iconFactory) return <span data-icon={props.name}>{props.name}</span>
	return options.iconFactory(props.name, props.size)
}

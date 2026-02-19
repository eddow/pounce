import { options } from '@pounce/ui'

/**
 * Setup icon factory for PicoCSS adapter
 *
 * By default, uses simple text symbols.
 * Apps can override with their preferred icon library.
 *
 * @example
 * ```tsx
 * import { setupIcons } from '@pounce/adapter-pico'
 * import { Icon } from '@tabler/icons-react'
 *
 * setupIcons((name, size) => <Icon name={name} size={size} />)
 * ```
 */
export function setupIcons(
	factory: (name: string, size: string | number | undefined) => JSX.Element
) {
	options.iconFactory = factory
}

// Default icon factory using ASCII symbols
setupIcons((name, size) => {
	const symbols: Record<string, string> = {
		check: '[✓]',
		close: '[×]',
		arrow: '[→]',
		menu: '[≡]',
		search: '[🔍]',
		warning: '[!]',
		error: '[✕]',
		info: '[i]',
		loading: '[⟳]',
	}

	return (
		<span
			data-icon={name}
			style={{
				fontSize: size || '1em',
				display: 'inline-block',
				textAlign: 'center',
				width: size || '1em',
			}}
		>
			{symbols[name] || name}
		</span>
	)
})

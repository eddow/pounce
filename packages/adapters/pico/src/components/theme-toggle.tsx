export type ThemeValue = 'auto' | 'light' | 'dark'

export type ThemeToggleProps = {
	/** Reactive object with a `theme` property — mutated on click */
	settings: { theme: ThemeValue }
	simple?: boolean
	el?: JSX.IntrinsicElements['button']
}

const ICONS: Record<ThemeValue, string> = { auto: '🌓', light: '☀️', dark: '🌙' }

const cycle = (t: ThemeValue): ThemeValue =>
	t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto'

/**
 * ThemeToggle - cycles 'auto' → 'light' → 'dark' → 'auto'.
 * Mutates `props.settings.theme`. Pair with DisplayProvider which owns the data-theme DOM attribute.
 */
export const ThemeToggle = (props: ThemeToggleProps) => (
	<button
		onClick={() => (props.settings.theme = cycle(props.settings.theme))}
		aria-label={`Theme: ${props.settings.theme}. Click to cycle.`}
		title={`Theme: ${props.settings.theme}. Click to cycle.`}
		{...props.el}
	>
		{props.simple
			? ICONS[props.settings.theme]
			: `${ICONS[props.settings.theme]} ${props.settings.theme}`}
	</button>
)

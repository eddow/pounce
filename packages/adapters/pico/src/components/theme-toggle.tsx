import type { Env } from '@pounce/core'
import { useDisplayContext } from '@pounce/kit'
import { type ThemeValue, themeToggleModel } from '@pounce/ui/models'

export type { ThemeValue } from '@pounce/ui/models'

export type ThemeToggleProps = {
	/** Reactive object with a `theme` property — mutated on click */
	settings: { theme: ThemeValue }
	simple?: boolean
	el?: JSX.IntrinsicElements['button']
}

const ICONS: Record<ThemeValue, string> = { auto: '🌓', light: '☀️', dark: '🌙' }

/**
 * ThemeToggle - cycles 'auto' → 'light' → 'dark' → 'auto'.
 * Mutates `props.settings.theme`. Pair with DisplayProvider which owns the data-theme DOM attribute.
 */
export const ThemeToggle = (props: ThemeToggleProps, env: Env) => {
	const dc = useDisplayContext(env)
	const m = themeToggleModel({
		settings: props.settings,
		get resolvedTheme() {
			return dc.theme
		},
	})

	return (
		<div class="pounce-theme-toggle" use={m.clickOutside}>
			<button {...props.el} {...m.button}>
				{props.simple ? ICONS[m.themeSetting] : `${ICONS[m.themeSetting]} ${m.currentLabel}`}
			</button>
			<div if={m.menuOpen} role="menu" class="pounce-theme-menu">
				<button {...m.autoButton}>Auto</button>
				<for each={m.allThemes}>
					{(theme: string) => <button {...m.optionButton(theme)}>{theme}</button>}
				</for>
			</div>
		</div>
	)
}

import { effect } from 'mutts'
import { compose } from '@pounce/core'
import { tablerOutlineMoon, tablerOutlineSun } from 'pure-glyf/icons'
import { client } from '@pounce/toolbox'
import { stored } from '@pounce/toolbox/entry-dom'
import { Button } from './button'

export interface DarkModeButtonProps {
	ariaLabel?: string
	icon?: string | JSX.Element
	children?: JSX.Children
	label?: boolean
	theme?: 'light' | 'dark'
	onThemeChange?: (theme: 'light' | 'dark') => void
}

const defaultIcons = {
	dark: tablerOutlineSun,
	light: tablerOutlineMoon,
}
const defaultChildren = {
	dark: 'Light',
	light: 'Dark',
}
const themeStorage = stored({
	theme: (client.prefersDark?.() ? 'dark' : 'light') as 'light' | 'dark',
})

export const DarkModeButton = (props: DarkModeButtonProps) => {
	const state = compose(
		{
			theme: undefined as 'light' | 'dark' | undefined,
			ariaLabel: undefined as string | undefined,
			icon: undefined as string | JSX.Element | undefined,
			onThemeChange: undefined as ((theme: 'light' | 'dark') => void) | undefined,
		},
		props,
		(state) => ({
			get label() {
				if (!state.label) return
				const theme = state.theme ?? themeStorage.theme
				return state.children && !(Array.isArray(state.children) && state.children.length === 0)
					? state.children
					: defaultChildren[theme]
			},
			get currentIcon() {
				const theme = state.theme ?? themeStorage.theme
				return state.icon || defaultIcons[theme]
			},
		})
	)

	// Sync state.theme with themeStorage.theme
	effect(() => {
		if (state.theme === undefined) {
			state.theme = themeStorage.theme
		} else {
			themeStorage.theme = state.theme
		}
	})

	// Sync theme with document element and notify changes
	effect(() => {
		const theme = themeStorage.theme
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.theme = theme
		}

		// Notify parent of theme change
		if (state.onThemeChange) {
			state.onThemeChange(theme)
		}
	})

	const handleToggle = () => {
		const next = themeStorage.theme === 'light' ? 'dark' : 'light'
		state.theme = next
	}

	return (
		<>
			<Button
				if={state.label}
				onClick={handleToggle}
				ariaLabel={state.ariaLabel || 'Toggle dark mode'}
				icon={state.currentIcon}
			>
				{state.label}
			</Button>
			<Button
				else
				onClick={handleToggle}
				ariaLabel={state.ariaLabel || 'Toggle dark mode'}
				icon={state.currentIcon}
			/>
		</>
	)
}

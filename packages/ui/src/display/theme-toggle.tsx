import type { Env } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { Icon } from '../components/icon'
import type { EnvSettings } from '@pounce/kit/env'

componentStyle.sass`
.pounce-theme-toggle
	display: inline-flex
	align-items: center
	position: relative

	.pounce-theme-toggle-main
		display: inline-flex
		align-items: center
		gap: 0.4rem
		padding: 0.4rem 0.75rem
		border: 1px solid var(--pounce-border, #d1d5db)
		border-radius: var(--pounce-border-radius, 0.5rem)
		background: var(--pounce-bg, #fff)
		color: var(--pounce-fg, #374151)
		cursor: pointer
		font-size: 0.875rem
		line-height: 1.5
		transition: background 0.15s ease, border-color 0.15s ease

		&:hover
			border-color: var(--pounce-primary, #3b82f6)

	.pounce-theme-toggle-dropdown
		display: inline-flex
		align-items: center
		padding: 0.4rem 0.35rem
		border: 1px solid var(--pounce-border, #d1d5db)
		border-left: none
		border-radius: 0 var(--pounce-border-radius, 0.5rem) var(--pounce-border-radius, 0.5rem) 0
		background: var(--pounce-bg, #fff)
		color: var(--pounce-fg, #374151)
		cursor: pointer
		font-size: 0.75rem
		transition: background 0.15s ease

		&:hover
			background: var(--pounce-bg-muted, #f3f4f6)

	.pounce-theme-toggle-main:has(+ .pounce-theme-toggle-dropdown)
		border-right: none
		border-radius: var(--pounce-border-radius, 0.5rem) 0 0 var(--pounce-border-radius, 0.5rem)

	.pounce-theme-toggle-menu
		position: absolute
		top: 100%
		right: 0
		margin-top: 0.25rem
		min-width: 8rem
		background: var(--pounce-bg, #fff)
		border: 1px solid var(--pounce-border, #d1d5db)
		border-radius: var(--pounce-border-radius, 0.5rem)
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
		z-index: 10
		overflow: hidden

	.pounce-theme-toggle-option
		display: flex
		align-items: center
		gap: 0.5rem
		width: 100%
		padding: 0.5rem 0.75rem
		border: none
		background: none
		color: var(--pounce-fg, #374151)
		cursor: pointer
		font-size: 0.875rem
		text-align: left

		&:hover
			background: var(--pounce-bg-muted, #f3f4f6)

		&[aria-checked="true"]
			font-weight: 600

	.pounce-theme-toggle-auto-badge
		font-size: 0.65rem
		opacity: 0.6
		margin-left: -0.2rem
`

export type ThemeToggleProps = {
	/** The EnvSettings object to read/write theme from */
	settings: EnvSettings
	/** Custom icons per theme. Default: sun/moon from adapter iconFactory */
	icons?: Record<string, JSX.Element | string>
	/** Custom labels per theme */
	labels?: Record<string, string>
	/** Label for the 'auto' option. Default: "Auto" */
	autoLabel?: string
	/** Hide the dropdown arrow (force simple toggle, no auto option) */
	simple?: boolean
	/** Additional themes beyond dark/light for the dropdown */
	themes?: string[]
	el?: JSX.GlobalHTMLAttributes
}

const DEFAULT_ICONS: Record<string, string> = { light: 'sun', dark: 'moon' }
const DEFAULT_LABELS: Record<string, string> = { light: 'Light', dark: 'Dark' }

export function ThemeToggle(props: ThemeToggleProps, env: Env) {
	let menuOpen = false
	let menuEl: HTMLElement | undefined

	const icons = () => props.icons ?? DEFAULT_ICONS
	const labels = () => props.labels ?? DEFAULT_LABELS
	const autoLabel = () => props.autoLabel ?? 'Auto'

	const resolvedTheme = () => env.theme
	const themeSetting = () => props.settings.theme ?? 'auto'
	const isAuto = () => themeSetting() === 'auto'

	const currentIcon = () => {
		const ic = icons()[resolvedTheme()]
		if (typeof ic === 'string') return <Icon name={ic} />
		return ic ?? <Icon name={resolvedTheme() === 'dark' ? 'moon' : 'sun'} />
	}

	const currentLabel = () => {
		const base = labels()[resolvedTheme()] ?? resolvedTheme()
		if (isAuto()) return `${autoLabel()} (${base})`
		return base
	}

	const toggle = () => {
		props.settings.theme = resolvedTheme() === 'dark' ? 'light' : 'dark'
	}

	const allThemes = () => {
		const base = ['light', 'dark']
		if (props.themes) return [...base, ...props.themes]
		return base
	}

	const selectTheme = (theme: string) => {
		props.settings.theme = theme
		menuOpen = false
	}

	const selectAuto = () => {
		props.settings.theme = 'auto'
		menuOpen = false
	}

	const toggleMenu = (e: MouseEvent) => {
		e.stopPropagation()
		menuOpen = !menuOpen
	}

	const handleClickOutside = (e: MouseEvent) => {
		if (menuEl && !menuEl.contains(e.target as Node)) {
			menuOpen = false
		}
	}

	return (
		<div
			class="pounce-theme-toggle"
			{...props.el}
			use={(el: HTMLElement) => {
				menuEl = el
				document.addEventListener('click', handleClickOutside)
				return () => document.removeEventListener('click', handleClickOutside)
			}}
		>
			<button
				class="pounce-theme-toggle-main"
				onClick={toggle}
				aria-label={currentLabel()}
				type="button"
			>
				{currentIcon()}
				{!props.simple && isAuto() ? <span class="pounce-theme-toggle-auto-badge">A</span> : null}
			</button>
			<button
				if={!props.simple}
				class="pounce-theme-toggle-dropdown"
				onClick={toggleMenu}
				aria-haspopup="true"
				aria-expanded={menuOpen}
				aria-label="Theme options"
				type="button"
			>
				<Icon name="chevron-down" size={12} />
			</button>
			<div
				if={menuOpen}
				class="pounce-theme-toggle-menu"
				role="menu"
			>
				<button
					class="pounce-theme-toggle-option"
					role="menuitemradio"
					aria-checked={isAuto()}
					onClick={selectAuto}
					type="button"
				>
					{autoLabel()}
				</button>
				<for each={allThemes()}>
					{(theme: string) => {
						const ic = icons()[theme]
						const icon = typeof ic === 'string'
							? <Icon name={ic} />
							: ic ?? null
						return (
							<button
								class="pounce-theme-toggle-option"
								role="menuitemradio"
								aria-checked={themeSetting() === theme}
								onClick={() => selectTheme(theme)}
								type="button"
							>
								{icon}
								{labels()[theme] ?? theme}
							</button>
						)
					}}
				</for>
			</div>
		</div>
	)
}

import { compose } from '@pounce/core'
import {
	tablerOutlineAlertCircle,
	tablerOutlineAlertOctagon,
	tablerOutlineBell,
	tablerOutlineBrightness,
	tablerOutlineCircleCheck,
	tablerOutlineInfoCircle,
	tablerOutlineX,
} from 'pure-glyf/icons'
import { css } from '@pounce/kit'
import { Icon } from './icon'
import type { Variant } from './variants'

css`
.pp-alert {
	--pp-alert-bg: var(--pico-muted-border-color, rgba(0, 0, 0, 0.08));
	--pp-alert-color: var(--pico-color, inherit);
	--pp-alert-border: transparent;
	position: relative;
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 0.75rem;
	padding: 0.85rem 1rem;
	border-radius: var(--pico-border-radius, 0.5rem);
	border: 1px solid var(--pp-alert-border);
	background-color: var(--pp-alert-bg);
	color: var(--pp-alert-color);
	align-items: flex-start;
}

.pp-alert-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
}

.pp-alert-body {
	display: flex;
	flex-direction: column;
	gap: 0.4rem;
}

.pp-alert-body > strong {
	font-size: 0.95rem;
}

.pp-alert-content {
	font-size: 0.9rem;
	line-height: 1.4;
}

.pp-alert-close {
	border: none;
	background: transparent;
	color: inherit;
	padding: 0.25rem;
	display: inline-flex;
	align-items: center;
	cursor: pointer;
}

.pp-alert-close:hover {
	opacity: 0.75;
}

.pp-alert-dismissible {
	padding-right: 2.5rem;
}

.pp-alert-primary {
	--pp-alert-bg: var(--pico-primary-background);
	--pp-alert-color: var(--pico-primary-inverse);
	--pp-alert-border: var(--pico-primary-border);
}

.pp-alert-secondary {
	--pp-alert-bg: var(
		--pico-secondary-background,
		var(--pico-muted-border-color, rgba(0, 0, 0, 0.08))
	);
	--pp-alert-color: var(--pico-secondary-inverse, inherit);
	--pp-alert-border: var(--pico-secondary-border, transparent);
}

.pp-alert-contrast {
	--pp-alert-bg: var(--pico-contrast-background);
	--pp-alert-color: var(--pico-contrast-inverse);
	--pp-alert-border: var(--pico-contrast-border);
}

.pp-alert-success {
	--pp-alert-bg: var(--pp-success-background);
	--pp-alert-color: var(--pp-success-inverse);
	--pp-alert-border: var(--pp-success-border);
}

.pp-alert-warning {
	--pp-alert-bg: var(--pp-warning-background);
	--pp-alert-color: var(--pp-warning-inverse);
	--pp-alert-border: var(--pp-warning-border);
}

.pp-alert-danger {
	--pp-alert-bg: var(--pp-danger-background);
	--pp-alert-color: var(--pp-danger-inverse);
	--pp-alert-border: var(--pp-danger-border);
}
`

const alertIcons: Record<Variant, string> = {
	primary: tablerOutlineInfoCircle,
	secondary: tablerOutlineBell,
	contrast: tablerOutlineBrightness,
	success: tablerOutlineCircleCheck,
	warning: tablerOutlineAlertCircle,
	danger: tablerOutlineAlertOctagon,
}

export type AlertProps = {
	variant?: Variant
	title?: string | JSX.Element
	icon?: string | JSX.Element | false
	dismissible?: boolean
	dismissLabel?: string
	onDismiss?: () => void
	role?: 'status' | 'alert'
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

export const Alert = (props: AlertProps) => {
	const state = compose({ variant: 'primary', dismissible: false, open: true }, props, (state) => ({
		get chosenIcon() {
			return state.icon === undefined ? alertIcons[state.variant] : state.icon
		},
		get role() {
			return state.role ?? (state.variant === 'danger' ? 'alert' : 'status')
		},
	}))
	function close() {
		state.open = false
		props.onDismiss?.()
	}

	return (
		<div
			if={state.open}
			role={state.role}
			{...state.el}
			class={[
				'pp-alert',
				`pp-alert-${state.variant}`,
				state.dismissible ? 'pp-alert-dismissible' : undefined,
				state.el?.class,
			]}
		>
			<span class="pp-alert-icon" if={state.chosenIcon} aria-hidden="true">
				{typeof state.chosenIcon === 'string' ? (
					<Icon icon={state.chosenIcon} size="20px" />
				) : (
					state.chosenIcon
				)}
			</span>
			<div class="pp-alert-body">
				<strong if={state.title}>{state.title}</strong>
				<div if={state.children} class="pp-alert-content">
					{state.children}
				</div>
			</div>
			<button
				if={state.dismissible}
				type="button"
				class="pp-alert-close"
				aria-label={state.dismissLabel ?? 'Dismiss'}
				onClick={close}
			>
				<Icon icon={tablerOutlineX} size="18px" />
			</button>
		</div>
	)
}

import { compose } from '@pounce/core'
import { tablerOutlineX } from 'pure-glyf/icons'
import { css } from '../lib/css'
import { Icon } from './icon'
import type { Variant } from './variants'
import { variantClass } from './variants'

css`
.pp-badge,
.pp-chip,
.pp-pill {
	--pp-token-bg: var(--pico-muted-border-color, rgba(0, 0, 0, 0.08));
	--pp-token-color: var(--pico-color, inherit);
	--pp-token-border: transparent;
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	font-weight: 600;
	line-height: 1;
	white-space: nowrap;
	text-decoration: none;
}

.pp-token-icon {
	display: inline-flex;
	align-items: center;
}

.pp-token-label {
	display: inline-flex;
	align-items: center;
}

.pp-badge {
	font-size: 0.7rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	padding: 0.25rem 0.6rem;
	border-radius: 999px;
	background-color: var(--pp-token-bg);
	color: var(--pp-token-color);
}

.pp-pill {
	font-size: 0.85rem;
	padding: 0.35rem 0.75rem;
	border-radius: 999px;
	background-color: var(--pp-token-bg);
	color: var(--pp-token-color);
}

.pp-chip {
	font-size: 0.85rem;
	padding: 0.35rem 0.65rem;
	border-radius: 999px;
	background-color: var(--pp-token-bg);
	color: var(--pp-token-color);
	border: 1px solid var(--pp-token-border);
	cursor: pointer;
	transition: filter 0.15s ease;
	box-shadow: none;
	appearance: none;
}

.pp-chip:hover {
	filter: brightness(0.95);
}

.pp-chip:active {
	filter: brightness(0.9);
}

.pp-chip:focus-visible {
	outline: var(--pico-outline-width) solid var(--pico-primary-focus, currentColor);
	outline-offset: 2px;
}

.pp-chip-dismiss {
	margin-left: 0.25rem;
	padding: 0;
	border: none;
	background: transparent;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	flex-grow: 0;
	width: 1.25rem;
	height: 1.25rem;
	color: inherit;
	cursor: pointer;
}

.pp-chip-dismiss:hover {
	opacity: 0.7;
}

.pp-variant-primary {
	--pp-token-bg: var(--pico-primary-background);
	--pp-token-color: var(--pico-primary-inverse);
	--pp-token-border: var(--pico-primary-border);
}

.pp-variant-secondary {
	--pp-token-bg: var(
		--pico-secondary-background,
		var(--pico-muted-border-color, rgba(0, 0, 0, 0.08))
	);
	--pp-token-color: var(--pico-secondary-inverse, inherit);
	--pp-token-border: var(--pico-secondary-border, transparent);
}

.pp-variant-contrast {
	--pp-token-bg: var(--pico-contrast-background);
	--pp-token-color: var(--pico-contrast-inverse);
	--pp-token-border: var(--pico-contrast-border);
}

.pp-variant-success {
	--pp-token-bg: var(--pp-success-background);
	--pp-token-color: var(--pp-success-inverse);
	--pp-token-border: var(--pp-success-border);
}

.pp-variant-warning {
	--pp-token-bg: var(--pp-warning-background);
	--pp-token-color: var(--pp-warning-inverse);
	--pp-token-border: var(--pp-warning-border);
}

.pp-variant-danger {
	--pp-token-bg: var(--pp-danger-background);
	--pp-token-color: var(--pp-danger-inverse);
	--pp-token-border: var(--pp-danger-border);
}
`

type StatusVariant = Variant | 'primary'

function variantKey(variant?: Variant): StatusVariant {
	if (!variant || variant === 'primary') return 'primary'
	return (variantClass(variant) || variant) as StatusVariant
}

function renderIcon(icon: string | JSX.Element | undefined, size = '16px') {
	if (icon === undefined) return null
	return (
		<span class="pp-token-icon" aria-hidden={typeof icon === 'string' ? true : undefined}>
			{typeof icon === 'string' ? <Icon icon={icon} size={size} /> : icon}
		</span>
	)
}

export type BadgeProps = {
	tag?: JSX.HTMLElementTag
	variant?: Variant
	icon?: string | JSX.Element
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

export const Badge = (props: BadgeProps) => {
	const state = compose({ tag: 'span', variant: 'primary' }, props)
	return (
		<dynamic
			tag={state.tag}
			{...state.el}
			class={['pp-badge', `pp-variant-${variantKey(state.variant)}`, state.el?.class]}
		>
			{renderIcon(state.icon, '14px')}
			<span class="pp-token-label">{state.children}</span>
		</dynamic>
	)
}

export type PillProps = {
	tag?: JSX.HTMLElementTag
	variant?: Variant
	icon?: string | JSX.Element
	trailingIcon?: string | JSX.Element
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

export const Pill = (props: PillProps) => {
	const state = compose({ tag: 'span', variant: 'primary' }, props)

	return (
		<dynamic
			tag={state.tag}
			{...state.el}
			class={['pp-pill', `pp-variant-${variantKey(state.variant)}`, state.el?.class]}
		>
			{renderIcon(state.icon)}
			<span class="pp-token-label">{state.children}</span>
			{renderIcon(state.trailingIcon)}
		</dynamic>
	)
}

export type ChipProps = {
	tag?: JSX.HTMLElementTag
	variant?: Variant
	icon?: string | JSX.Element
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
	dismissible?: boolean
	dismissLabel?: string
	onDismiss?: () => void
}

export const Chip = (props: ChipProps) => {
	const state = compose(
		{ tag: 'button', variant: 'secondary', dismissible: false, open: true },
		props
	)

	function close() {
		state.open = false
		state.onDismiss?.()
	}

	// Avoid nested interactive controls: if dismissible and tag is button, switch to div with group role
	const containerTag =
		(state.tag === 'button' || state.tag === undefined) && state.dismissible ? 'div' : state.tag
	const containerRole = containerTag === 'div' && state.dismissible ? 'group' : undefined

	return (
		<dynamic
			if={state.open}
			tag={containerTag}
			type={containerTag === 'button' ? 'button' : undefined}
			{...state.el}
			role={containerRole}
			class={['pp-chip', `pp-variant-${variantKey(state.variant)}`, state.el?.class]}
		>
			{renderIcon(state.icon)}
			<span class="pp-token-label">{state.children}</span>
			<button
				if={state.dismissible}
				type="button"
				class="pp-chip-dismiss"
				aria-label={state.dismissLabel ?? 'Remove'}
				onClick={(event) => {
					event.stopPropagation()
					close()
				}}
			>
				<Icon icon={tablerOutlineX} size="14px" />
			</button>
		</dynamic>
	)
}

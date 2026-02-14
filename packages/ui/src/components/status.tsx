import { compose } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter/registry'
import { asVariant, getVariantTrait } from '../shared/variants'
import { Icon } from './icon'
import type { Trait } from '@pounce/core'

/**
 * Helper to get variant traits as array or undefined
 */
function getVariantTraits(variant: string | undefined): Trait[] | undefined {
	const trait = getVariantTrait(variant)
	return trait ? [trait] : undefined
}

componentStyle.sass`
.pounce-badge,
.pounce-chip,
.pounce-pill
	--pounce-token-bg: var(--pounce-bg-muted, rgba(0, 0, 0, 0.08))
	--pounce-token-color: var(--pounce-fg, inherit)
	--pounce-token-border: transparent
	display: inline-flex
	align-items: center
	gap: 0.35rem
	font-weight: 600
	line-height: 1
	white-space: nowrap
	text-decoration: none

.pounce-token-icon
	display: inline-flex
	align-items: center

.pounce-token-label
	display: inline-flex
	align-items: center

.pounce-badge
	font-size: 0.7rem
	text-transform: uppercase
	letter-spacing: 0.05em
	padding: 0.25rem 0.6rem
	border-radius: 999px
	background-color: var(--pounce-token-bg)
	color: var(--pounce-token-color)

.pounce-pill
	font-size: 0.85rem
	padding: 0.35rem 0.75rem
	border-radius: 999px
	background-color: var(--pounce-token-bg)
	color: var(--pounce-token-color)

.pounce-chip
	font-size: 0.85rem
	padding: 0.35rem 0.65rem
	border-radius: 999px
	background-color: var(--pounce-token-bg)
	color: var(--pounce-token-color)
	border: 1px solid var(--pounce-token-border)
	cursor: pointer
	transition: filter 0.15s ease
	box-shadow: none
	appearance: none

	&:hover
		filter: brightness(0.95)

	&:active
		filter: brightness(0.9)

	&:focus-visible
		outline: 2px solid var(--pounce-primary-focus, currentColor)
		outline-offset: 2px

.pounce-chip-dismiss
	margin-left: 0.25rem
	padding: 0
	border: none
	background: transparent
	display: inline-flex
	align-items: center
	justify-content: center
	flex-shrink: 0
	flex-grow: 0
	width: 1.25rem
	height: 1.25rem
	color: inherit
	cursor: pointer

	&:hover
		opacity: 0.7
`

function renderIcon(icon: string | JSX.Element | undefined, size = '16px') {
	if (icon === undefined) return null
	return (
		<span class="pounce-token-icon" aria-hidden={typeof icon === 'string' ? true : undefined}>
			{typeof icon === 'string' ? <Icon name={icon} size={size} /> : icon}
		</span>
	)
}

/** Props for {@link Badge}. */
export type BadgeProps = {
	/** HTML element tag. @default 'span' */
	tag?: JSX.HTMLElementTag
	/** Variant name. @default 'primary' */
	variant?: string
	/** Leading icon name or element. */
	icon?: string | JSX.Element
	/** Pass-through HTML attributes. */
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

const BadgeBase = (props: BadgeProps) => {
	const adapter = getAdapter('Badge')
	const state = compose({ tag: 'span', variant: 'primary' }, props)
	const baseTrait = { classes: [adapter.classes?.base || 'pounce-badge'] }

	return (
		<dynamic
			tag={state.tag}
			{...state.el}
			traits={[baseTrait, ...(getVariantTraits(state.variant) || [])]}
		>
			{renderIcon(state.icon, '14px')}
			<span class={adapter.classes?.label || 'pounce-token-label'}>{state.children}</span>
		</dynamic>
	)
}

/**
 * Small uppercase status label.
 *
 * Supports variant dot-syntax: `<Badge.success>`.
 *
 * @example
 * ```tsx
 * <Badge>New</Badge>
 * <Badge.danger icon="alert">Error</Badge.danger>
 * ```
 *
 * Adapter key: `Badge` (BaseAdaptation)
 */
export const Badge = asVariant(BadgeBase)

/** Props for {@link Pill}. */
export type PillProps = {
	/** HTML element tag. @default 'span' */
	tag?: JSX.HTMLElementTag
	/** Variant name. @default 'primary' */
	variant?: string
	/** Leading icon name or element. */
	icon?: string | JSX.Element
	/** Trailing icon name or element. */
	trailingIcon?: string | JSX.Element
	/** Pass-through HTML attributes. */
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

const PillBase = (props: PillProps) => {
	const adapter = getAdapter('Pill')
	const state = compose({ tag: 'span', variant: 'primary' }, props)
	const baseTrait = { classes: [adapter.classes?.base || 'pounce-pill'] }

	return (
		<dynamic
			tag={state.tag}
			{...state.el}
			traits={[baseTrait, ...(getVariantTraits(state.variant) || [])]}
		>
			{renderIcon(state.icon)}
			<span class={adapter.classes?.label || 'pounce-token-label'}>{state.children}</span>
			{renderIcon(state.trailingIcon)}
		</dynamic>
	)
}

/**
 * Medium status indicator with optional leading and trailing icons.
 *
 * Supports variant dot-syntax: `<Pill.warning>`.
 *
 * @example
 * ```tsx
 * <Pill icon="user" trailingIcon="chevron-right">John</Pill>
 * ```
 *
 * Adapter key: `Pill` (BaseAdaptation)
 */
export const Pill = asVariant(PillBase)

/** Props for {@link Chip}. */
export type ChipProps = {
	/** HTML element tag. @default 'button' */
	tag?: JSX.HTMLElementTag
	/** Variant name. @default 'secondary' */
	variant?: string
	/** Leading icon name or element. */
	icon?: string | JSX.Element
	/** Pass-through HTML attributes. */
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
	/** Show a dismiss (×) button. @default false */
	dismissible?: boolean
	/** Accessible label for the dismiss button. @default 'Remove' */
	dismissLabel?: string
	/** Called when the chip is dismissed. */
	onDismiss?: () => void
}

const ChipBase = (props: ChipProps) => {
	const adapter = getAdapter('Chip')
	const state = compose(
		{ tag: 'button', variant: 'secondary', dismissible: false, open: true },
		props
	)
	const baseTrait = { classes: [adapter.classes?.base || 'pounce-chip'] }

	function close() {
		state.open = false
		state.onDismiss?.()
	}

	const containerTag =
		(state.tag === 'button' || state.tag === undefined) && state.dismissible ? 'div' : state.tag
	const containerRole = containerTag === 'div' && state.dismissible ? 'group' : undefined

	return (
		<dynamic
			tag={containerTag}
			role={containerRole}
			{...state.el}
			traits={[baseTrait, ...(getVariantTraits(state.variant) || [])]}
		>
			<dynamic
				if={state.open}
				tag={containerTag}
				type={containerTag === 'button' ? 'button' : undefined}
				{...state.el}
				role={containerRole}
				traits={[baseTrait, ...(getVariantTraits(state.variant) || [])]}
			>
			{renderIcon(state.icon)}
			<span class={adapter.classes?.label || 'pounce-token-label'}>{state.children}</span>
			<button
				if={state.dismissible}
				type="button"
				class={adapter.classes?.dismiss || 'pounce-chip-dismiss'}
				aria-label={state.dismissLabel ?? 'Remove'}
				onClick={(event) => {
					event.stopPropagation()
					close()
				}}
			>
				<Icon name="x" size="14px" />
			</button>
		</dynamic>
	</dynamic>
	)
}

/**
 * Interactive token — clickable, optionally dismissible.
 *
 * Supports variant dot-syntax: `<Chip.secondary>`.
 *
 * @example
 * ```tsx
 * <Chip dismissible onDismiss={() => remove(tag)}>Tag</Chip>
 * ```
 *
 * Adapter key: `Chip` (BaseAdaptation)
 */
export const Chip = asVariant(ChipBase)

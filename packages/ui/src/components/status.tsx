import { reactive } from 'mutts'
import { defaults } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { getAdapter } from '../adapter/registry'
import { asVariant, variantProps } from '../shared/variants'
import { Icon } from './icon'

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
	return (
		<dynamic
			tag={props.tag ?? 'span'}
			{...variantProps(props.variant)}
			{...props.el}
			class={adapter.classes?.base || 'pounce-badge'}
		>
			{renderIcon(props.icon, '14px')}
			<span class={adapter.classes?.label || 'pounce-token-label'}>{props.children}</span>
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
	return (
		<dynamic
			tag={props.tag ?? 'span'}
			{...variantProps(props.variant)}
			{...props.el}
			class={adapter.classes?.base || 'pounce-pill'}
		>
			{renderIcon(props.icon)}
			<span class={adapter.classes?.label || 'pounce-token-label'}>{props.children}</span>
			{renderIcon(props.trailingIcon)}
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
	const local = reactive({ open: true })
	function close() {
		local.open = false
		props.onDismiss?.()
	}

	const p = defaults(props, { tag: 'button' as JSX.HTMLElementTag, dismissible: false })
	const state = {
		get containerTag() { return (p.tag === 'button') && p.dismissible ? 'div' as const : p.tag },
		get containerRole() { return this.containerTag === 'div' && p.dismissible ? 'group' as const : undefined },
	}
	const baseClass = adapter.classes?.base || 'pounce-chip'

	return (
		<dynamic
			tag={state.containerTag}
			role={state.containerRole}
			{...variantProps(props.variant)}
			{...props.el}
			class={baseClass}
		>
			<dynamic
				if={local.open}
				tag={state.containerTag}
				type={state.containerTag === 'button' ? 'button' : undefined}
				{...props.el}
				role={state.containerRole}
				{...variantProps(props.variant)}
				class={baseClass}
			>
				{renderIcon(props.icon)}
				<span class={adapter.classes?.label || 'pounce-token-label'}>{props.children}</span>
				<button
					if={p.dismissible}
					type="button"
					class={adapter.classes?.dismiss || 'pounce-chip-dismiss'}
					aria-label={props.dismissLabel ?? 'Remove'}
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

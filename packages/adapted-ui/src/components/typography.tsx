import { defaults } from '@pounce/core'
import { A, componentStyle } from '@pounce/kit'
import { getAdapter } from '../adapter/registry'
import { type Variant, variantProps } from '../shared/variants'

componentStyle.sass`
.pounce-heading
	margin: 0
	font-weight: 600
	color: var(--pounce-color, inherit)

.pounce-heading + .pounce-heading,
.pounce-heading + .pounce-text
	margin-top: 0.5rem

.pounce-heading-level-1
	font-size: clamp(2.5rem, 4vw, 3rem)

.pounce-heading-level-2
	font-size: clamp(2rem, 3vw, 2.4rem)

.pounce-heading-level-3
	font-size: clamp(1.6rem, 2.5vw, 2rem)

.pounce-heading-level-4
	font-size: clamp(1.4rem, 2vw, 1.6rem)

.pounce-heading-level-5
	font-size: 1.2rem

.pounce-heading-level-6
	font-size: 1rem
	text-transform: uppercase
	letter-spacing: 0.06em

.pounce-heading-align-center
	text-align: center

.pounce-heading-align-end
	text-align: end

.pounce-heading-variant-primary
	color: var(--pounce-primary, inherit)

.pounce-heading-variant-secondary
	color: var(--pounce-secondary, var(--pounce-muted-border-color))

.pounce-heading-variant-contrast
	color: var(--pounce-contrast, inherit)

.pounce-heading-variant-success
	color: var(--pounce-success, inherit)

.pounce-heading-variant-warning
	color: var(--pounce-warning, inherit)

.pounce-heading-variant-danger
	color: var(--pounce-danger, inherit)

.pounce-text
	margin: 0
	color: var(--pounce-color, inherit)
	line-height: 1.6

.pounce-text + .pounce-text
	margin-top: 0.75rem

.pounce-text-sm
	font-size: 0.9rem

.pounce-text-md
	font-size: 1rem

.pounce-text-lg
	font-size: 1.1rem

.pounce-text-muted
	color: var(--pounce-muted-color, rgba(0, 0, 0, 0.6))

.pounce-text-variant-primary
	color: var(--pounce-color, inherit)

.pounce-text-variant-secondary
	color: var(--pounce-secondary, var(--pounce-muted-border-color))

.pounce-text-variant-contrast
	color: var(--pounce-contrast, inherit)

.pounce-text-variant-success
	color: var(--pounce-success, inherit)

.pounce-text-variant-warning
	color: var(--pounce-warning, inherit)

.pounce-text-variant-danger
	color: var(--pounce-danger, inherit)

.pounce-link
	color: var(--pounce-primary, inherit)
	text-decoration: underline
	text-decoration-thickness: 2px
	text-underline-offset: 2px
	font-weight: 600

.pounce-link:hover
	filter: brightness(0.95)

.pounce-link:active
	filter: brightness(0.9)

.pounce-link-variant-primary
	color: var(--pounce-primary, inherit)

.pounce-link-variant-secondary
	color: var(--pounce-secondary, inherit)

.pounce-link-variant-contrast
	color: var(--pounce-contrast, inherit)

.pounce-link-variant-success
	color: var(--pounce-success, inherit)

.pounce-link-variant-warning
	color: var(--pounce-warning, inherit)

.pounce-link-variant-danger
	color: var(--pounce-danger, inherit)

.pounce-link-no-underline
	text-decoration: none
`

type HeadingAlign = 'start' | 'center' | 'end'

function variantFallbackClass(prefix: string, variant?: Variant): string | undefined {
	if (!variant) return `${prefix}-primary`
	return `${prefix}-${variant}`
}

export type HeadingProps = {
	level?: 1 | 2 | 3 | 4 | 5 | 6
	tag?: JSX.HTMLElementTag
	variant?: Variant
	align?: HeadingAlign
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

export const Heading = (props: HeadingProps) => {
	const adapter = getAdapter('Heading')
	const p = defaults(props, { align: 'start' as HeadingAlign })
	const resolvedLevel = () => Math.min(6, Math.max(1, props.level ?? 2)) as 1 | 2 | 3 | 4 | 5 | 6
	const state = {
		get level() {
			return resolvedLevel()
		},
		get tag() {
			return props.tag ?? `h${resolvedLevel()}`
		},
	}

	return (
		<dynamic
			tag={state.tag}
			{...variantProps(props.variant)}
			{...props.el}
			class={[
				adapter?.classes?.base ?? 'pounce-heading',
				`pounce-heading-level-${state.level}`,
				Object.keys(variantProps(props.variant)).length > 0
					? undefined
					: variantFallbackClass('pounce-heading-variant', props.variant),
				p.align ? `pounce-heading-align-${p.align}` : undefined,
			]}
		>
			{props.children}
		</dynamic>
	)
}

type TextSize = 'sm' | 'md' | 'lg'

export type TextProps = {
	tag?: JSX.HTMLElementTag
	variant?: Variant
	size?: TextSize
	muted?: boolean
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

export const Text = (props: TextProps) => {
	const adapter = getAdapter('Text')

	return (
		<dynamic
			tag={props.tag ?? 'p'}
			{...variantProps(props.variant)}
			{...props.el}
			class={[
				adapter?.classes?.base ?? 'pounce-text',
				`pounce-text-${props.size ?? 'md'}`,
				Object.keys(variantProps(props.variant)).length > 0
					? undefined
					: variantFallbackClass('pounce-text-variant', props.variant),
				(props.muted ?? false) ? 'pounce-text-muted' : undefined,
			]}
		>
			{props.children}
		</dynamic>
	)
}

export type LinkProps = JSX.IntrinsicElements['a'] & {
	variant?: Variant
	underline?: boolean
}

export const Link = (props: LinkProps) => {
	const adapter = getAdapter('Link')

	return (
		<A
			{...variantProps(props.variant)}
			{...props}
			class={[
				adapter?.classes?.base ?? 'pounce-link',
				Object.keys(variantProps(props.variant)).length > 0
					? undefined
					: variantFallbackClass('pounce-link-variant', props.variant),
				(props.underline ?? true) ? undefined : 'pounce-link-no-underline',
			]}
		>
			{props.children}
		</A>
	)
}

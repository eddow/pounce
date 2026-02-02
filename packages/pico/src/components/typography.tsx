import { compose } from '@pounce/core'
import { css } from '@pounce/kit'
import { A } from '@pounce/kit'
import type { Variant } from './variants'
import { variantClass } from './variants'

css`
.pp-heading {
	margin: 0;
	font-weight: 600;
	color: var(--pico-color, inherit);
}

.pp-heading + .pp-heading,
.pp-heading + .pp-text {
	margin-top: 0.5rem;
}

.pp-heading-level-1 {
	font-size: clamp(2.5rem, 4vw, 3rem);
}

.pp-heading-level-2 {
	font-size: clamp(2rem, 3vw, 2.4rem);
}

.pp-heading-level-3 {
	font-size: clamp(1.6rem, 2.5vw, 2rem);
}

.pp-heading-level-4 {
	font-size: clamp(1.4rem, 2vw, 1.6rem);
}

.pp-heading-level-5 {
	font-size: 1.2rem;
}

.pp-heading-level-6 {
	font-size: 1rem;
	text-transform: uppercase;
	letter-spacing: 0.06em;
}

.pp-heading-align-center {
	text-align: center;
}

.pp-heading-align-end {
	text-align: end;
}

.pp-heading-variant-primary {
	color: var(--pico-primary, inherit);
}

.pp-heading-variant-secondary {
	color: var(--pico-secondary, var(--pico-muted-border-color));
}

.pp-heading-variant-contrast {
	color: var(--pico-contrast, inherit);
}

.pp-heading-variant-success {
	color: var(--pp-success, inherit);
}

.pp-heading-variant-warning {
	color: var(--pp-warning, inherit);
}

.pp-heading-variant-danger {
	color: var(--pp-danger, inherit);
}

.pp-text {
	margin: 0;
	color: var(--pico-color, inherit);
	line-height: 1.6;
}

.pp-text + .pp-text {
	margin-top: 0.75rem;
}

.pp-text-sm {
	font-size: 0.9rem;
}

.pp-text-md {
	font-size: 1rem;
}

.pp-text-lg {
	font-size: 1.1rem;
}

.pp-text-muted {
	color: var(--pico-muted-color, rgba(0, 0, 0, 0.6));
}

.pp-text-variant-primary {
	color: var(--pico-color, inherit);
}

.pp-text-variant-secondary {
	color: var(--pico-secondary, var(--pico-muted-border-color));
}

.pp-text-variant-contrast {
	color: var(--pico-contrast, inherit);
}

.pp-text-variant-success {
	color: var(--pp-success, inherit);
}

.pp-text-variant-warning {
	color: var(--pp-warning, inherit);
}

.pp-text-variant-danger {
	color: var(--pp-danger, inherit);
}

.pp-link {
	color: var(--pico-primary, inherit);
	text-decoration: underline;
	text-decoration-thickness: 2px;
	text-underline-offset: 2px;
	font-weight: 600;
}

.pp-link:hover {
	filter: brightness(0.95);
}

.pp-link:active {
	filter: brightness(0.9);
}

.pp-link-variant-primary {
	color: var(--pico-primary, inherit);
}

.pp-link-variant-secondary {
	color: var(--pico-secondary, inherit);
}

.pp-link-variant-contrast {
	color: var(--pico-contrast, inherit);
}

.pp-link-variant-success {
	color: var(--pp-success, inherit);
}

.pp-link-variant-warning {
	color: var(--pp-warning, inherit);
}

.pp-link-variant-danger {
	color: var(--pp-danger, inherit);
}

.pp-link-no-underline {
	text-decoration: none;
}
`

type HeadingAlign = 'start' | 'center' | 'end'

function toneForVariant(variant?: Variant): string {
	if (!variant || variant === 'primary') return 'primary'
	return variantClass(variant) || variant
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
	const defaults = { level: 2, variant: 'primary', align: 'start' as HeadingAlign }
	const state = compose(defaults, props, () => {
		const resolvedLevel = () => Math.min(6, Math.max(1, props.level ?? defaults.level))
		return {
			get level() {
				return resolvedLevel() as 1 | 2 | 3 | 4 | 5 | 6
			},
			get tag() {
				return props.tag ?? `h${resolvedLevel()}`
			},
			get align() {
				return props.align ?? defaults.align
			},
		}
	})

	return (
		<dynamic
			tag={state.tag}
			{...state.el}
			class={[
				'pp-heading',
				`pp-heading-level-${state.level}`,
				`pp-heading-variant-${toneForVariant(state.variant)}`,
				state.align ? `pp-heading-align-${state.align}` : undefined,
				state.el?.class,
			]}
		>
			{state.children}
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
	const state = compose(
		{ tag: 'p', variant: 'primary', size: 'md' as TextSize, muted: false },
		props
	)

	return (
		<dynamic
			tag={state.tag}
			{...state.el}
			class={[
				'pp-text',
				`pp-text-${state.size}`,
				`pp-text-variant-${toneForVariant(state.variant)}`,
				state.muted ? 'pp-text-muted' : undefined,
				state.el?.class,
			]}
		>
			{state.children}
		</dynamic>
	)
}

export type LinkProps = JSX.IntrinsicElements['a'] & {
	variant?: Variant
	underline?: boolean
}

export const Link = (props: LinkProps) => {
	const state = compose({ variant: 'primary', underline: true }, props)

	return (
		<A
			{...state}
			class={[
				'pp-link',
				`pp-link-variant-${toneForVariant(state.variant)}`,
				state.underline ? undefined : 'pp-link-no-underline',
				state.class,
			]}
		>
			{state.children}
		</A>
	)
}

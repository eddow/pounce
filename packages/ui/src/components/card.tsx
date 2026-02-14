import { compose } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter/registry'
import { asVariant, getVariantTrait } from '../shared/variants'
import type { Trait } from '@pounce/core'

/**
 * Helper to get variant traits as array or undefined
 */
function getVariantTraits(variant: string | undefined): Trait[] | undefined {
	const trait = getVariantTrait(variant)
	return trait ? [trait] : undefined
}

componentStyle.sass`
.pounce-card
	background: var(--pounce-card-bg, var(--pounce-bg, #fff))
	color: var(--pounce-card-color, var(--pounce-fg, inherit))
	border: 1px solid var(--pounce-card-border, var(--pounce-border, rgba(0, 0, 0, 0.1)))
	border-radius: var(--pounce-border-radius, 0.5rem)
	overflow: hidden

.pounce-card-header
	padding: 1rem 1.25rem
	border-bottom: 1px solid var(--pounce-card-border, var(--pounce-border, rgba(0, 0, 0, 0.1)))
	font-weight: 600

.pounce-card-body
	padding: 1.25rem

.pounce-card-footer
	padding: 1rem 1.25rem
	border-top: 1px solid var(--pounce-card-border, var(--pounce-border, rgba(0, 0, 0, 0.1)))
`

export type CardProps = {
	variant?: string
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

const CardBase = (props: CardProps) => {
	const adapter = getAdapter('Card')
	const state = compose({ variant: 'primary' }, props)
	const baseTrait = { classes: [adapter.classes?.base || 'pounce-card'] }

	return (
		<article
			{...state.el}
			traits={[baseTrait, ...(getVariantTraits(state.variant) || [])]}
		>
			{state.children}
		</article>
	)
}

/**
 * Semantic card component using `<article>`.
 *
 * Supports variant dot-syntax: `<Card.outlined>`, `<Card.elevated>`.
 *
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header>Title</Card.Header>
 *   <Card.Body>Content here</Card.Body>
 *   <Card.Footer>Actions</Card.Footer>
 * </Card>
 * ```
 *
 * Adapter key: `Card` (BaseAdaptation)
 */
export const Card = Object.assign(asVariant(CardBase), {
	Header: CardHeader,
	Body: CardBody,
	Footer: CardFooter,
})

export type CardSectionProps = {
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

function CardHeader(props: CardSectionProps) {
	const adapter = getAdapter('Card')
	return (
		<header {...props.el} class={adapter.classes?.header || 'pounce-card-header'}>
			{props.children}
		</header>
	)
}

function CardBody(props: CardSectionProps) {
	const adapter = getAdapter('Card')
	return (
		<div {...props.el} class={adapter.classes?.body || 'pounce-card-body'}>
			{props.children}
		</div>
	)
}

function CardFooter(props: CardSectionProps) {
	const adapter = getAdapter('Card')
	return (
		<footer {...props.el} class={adapter.classes?.footer || 'pounce-card-footer'}>
			{props.children}
		</footer>
	)
}

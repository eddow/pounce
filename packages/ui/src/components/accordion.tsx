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
.pounce-accordion
	border: 1px solid var(--pounce-accordion-border, var(--pounce-border, rgba(0, 0, 0, 0.1)))
	border-radius: var(--pounce-border-radius, 0.5rem)
	overflow: hidden

	& + .pounce-accordion
		border-top: none
		border-radius: 0

	&:first-child
		border-radius: var(--pounce-border-radius, 0.5rem) var(--pounce-border-radius, 0.5rem) 0 0

	&:last-child
		border-radius: 0 0 var(--pounce-border-radius, 0.5rem) var(--pounce-border-radius, 0.5rem)

	&:only-child
		border-radius: var(--pounce-border-radius, 0.5rem)

.pounce-accordion-summary
	display: flex
	align-items: center
	padding: 1rem 1.25rem
	cursor: pointer
	font-weight: 600
	list-style: none
	user-select: none
	background: var(--pounce-accordion-header-bg, transparent)

	&::-webkit-details-marker
		display: none

	&::marker
		display: none

	&::after
		content: ''
		margin-left: auto
		width: 0.5rem
		height: 0.5rem
		border-right: 2px solid currentColor
		border-bottom: 2px solid currentColor
		transform: rotate(45deg)
		transition: transform 0.2s ease

	&:hover
		background: var(--pounce-accordion-header-hover, rgba(0, 0, 0, 0.03))

.pounce-accordion[open] > .pounce-accordion-summary::after
	transform: rotate(-135deg)

.pounce-accordion-content
	padding: 0 1.25rem 1rem

.pounce-accordion-group
	display: flex
	flex-direction: column
`

export type AccordionProps = {
	open?: boolean
	onToggle?: (open: boolean) => void
	summary: JSX.Children
	variant?: string
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

const AccordionBase = (props: AccordionProps) => {
	const adapter = getAdapter('Accordion')
	const state = compose({ open: false, variant: 'primary' }, props)
	const baseTrait = { classes: [adapter.classes?.base || 'pounce-accordion'] }

	return (
		<details
			{...state.el}
			traits={[baseTrait, ...(getVariantTraits(state.variant) || [])]}
			open={state.open}
			onToggle={(e: Event) => {
				const details = e.currentTarget as HTMLDetailsElement
				state.onToggle?.(details.open)
			}}
		>
			<summary class={adapter.classes?.summary || 'pounce-accordion-summary'}>
				{state.summary}
			</summary>
			<div class={adapter.classes?.content || 'pounce-accordion-content'}>
				{state.children}
			</div>
		</details>
	)
}

/**
 * Disclosure component using native `<details>`/`<summary>`.
 *
 * Supports variant dot-syntax: `<Accordion.primary>`.
 *
 * @example
 * ```tsx
 * <Accordion summary="Section 1">Content here</Accordion>
 *
 * <AccordionGroup name="faq">
 *   <Accordion summary="Q1">Answer 1</Accordion>
 *   <Accordion summary="Q2">Answer 2</Accordion>
 * </AccordionGroup>
 * ```
 *
 * Adapter key: `Accordion` (BaseAdaptation)
 */
export const Accordion = asVariant(AccordionBase)

export type AccordionGroupProps = {
	name: string
	el?: JSX.GlobalHTMLAttributes
	children?: JSX.Children
}

/**
 * Groups `<Accordion>` items with a shared `name` for exclusive-open behaviour (HTML native).
 *
 * @example
 * ```tsx
 * <AccordionGroup name="faq">
 *   <Accordion summary="Q1">A1</Accordion>
 *   <Accordion summary="Q2">A2</Accordion>
 * </AccordionGroup>
 * ```
 */
export const AccordionGroup = (props: AccordionGroupProps) => {
	const adapter = getAdapter('Accordion')
	return (
		<div {...props.el} class={adapter.classes?.group || 'pounce-accordion-group'}>
			{props.children}
		</div>
	)
}

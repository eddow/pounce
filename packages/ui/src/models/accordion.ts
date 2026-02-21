// TODO: to review
// TODO: Hungry dog
import type { ElementPassthroughProps, VariantProps } from '../shared/types'

// ── Types ───────────────────────────────────────────────────────────────────

export type AccordionProps = VariantProps &
	ElementPassthroughProps<'details'> & {
		/** Controlled open state */
		open?: boolean
		/** Called when the details element is toggled */
		onToggle?: (open: boolean) => void
		/** Summary/header content */
		summary: JSX.Children
		children?: JSX.Children
	}

export type AccordionModel = {
	/** Spreadable attrs for the `<details>` element */
	readonly details: JSX.IntrinsicElements['details'] & {
		readonly open: boolean | undefined
		readonly onToggle: (e: Event) => void
	}
}

export type AccordionGroupProps = ElementPassthroughProps<'div'> & {
	/**
	 * Shared name for exclusive-open behaviour (native HTML `<details name="...">` attribute).
	 * Only one accordion in the group can be open at a time.
	 */
	name: string
	children?: JSX.Children
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Headless accordion logic.
 *
 * Uses native `<details>`/`<summary>` semantics.
 * The adapter spreads `model.details` on the details element.
 * For exclusive-open groups, pass `AccordionGroupProps.name` as the `name`
 * attribute on the `<details>` element (native HTML behaviour).
 *
 * @example
 * ```tsx
 * const Accordion = (props: AccordionProps) => {
 *   const model = accordionModel(props)
 *   return (
 *     <details {...model.details}>
 *       <summary>{props.summary}</summary>
 *       {props.children}
 *     </details>
 *   )
 * }
 * ```
 */
export function accordionModel(props: AccordionProps): AccordionModel {
	const model: AccordionModel = {
		get details() {
			return {
				get open() {
					return props.open
				},
				get onToggle() {
					return (e: Event) => {
						const details = e.currentTarget as HTMLDetailsElement
						props.onToggle?.(details.open)
					}
				},
			}
		},
	}
	return model
}

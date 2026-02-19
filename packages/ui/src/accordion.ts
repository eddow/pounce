import type { ElementPassthroughProps, VariantProps } from './shared/types'

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

export type AccordionState = {
	/** Current open state */
	readonly open: boolean | undefined
	/** onToggle handler to wire to the details element */
	readonly onToggle: (e: Event) => void
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
 * The adapter wires state.onToggle to the details element's onToggle event.
 * For exclusive-open groups, pass `AccordionGroupProps.name` as the `name`
 * attribute on the `<details>` element (native HTML behaviour).
 *
 * @example
 * ```tsx
 * const Accordion = (props: AccordionProps) => {
 *   const state = useAccordion(props)
 *   return (
 *     <details open={state.open} onToggle={state.onToggle}>
 *       <summary>{props.summary}</summary>
 *       {props.children}
 *     </details>
 *   )
 * }
 * ```
 */
export function useAccordion(props: AccordionProps): AccordionState {
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
}

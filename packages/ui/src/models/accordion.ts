import type { Env } from '@pounce/core'
import type { ElementPassthroughProps } from '../shared/types'
// TODO: we should have the accordionGroup component here - in components I mean, in `ui` - as it is a purely behavior-forwarding-children component
// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Reactive group variable injected by `AccordionGroup` into the env.
 * - `HTMLDetailsElement | null` → single-open (exclusive): at most one open at a time.
 * - `Set<HTMLDetailsElement>` → multi-open: any subset can be open.
 */
export type AccordionGroupVar = { value: HTMLDetailsElement | null } | Set<HTMLDetailsElement>

export type AccordionProps = ElementPassthroughProps<'details'> & {
	/** Controlled open state */
	open?: boolean
	/** Called when the details element is toggled */
	onToggle?: (open: boolean) => void
	/** Summary/header content */
	summary: JSX.Children
	children?: JSX.Children
}

export type AccordionEnv = Env & {
	/** Injected by AccordionGroup — reactive group variable */
	accordionGroup?: AccordionGroupVar
}

export type AccordionModel = {
	/** Spreadable attrs for the `<details>` element */
	readonly details: JSX.IntrinsicElements['details'] & {
		readonly open: boolean | undefined
		readonly onToggle: (e: Event) => void
	}
	/** Mount callback — registers this element with the group */
	readonly onMount: (el: HTMLDetailsElement) => void
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Headless accordion logic.
 *
 * Uses native `<details>`/`<summary>` semantics.
 * The adapter spreads `model.details` and calls `use:mount={model.onMount}`.
 *
 * For grouping, wrap accordions in `<AccordionGroup>` (adapter-provided).
 * The group is injected via `env.accordionGroup`:
 * - `{ value: HTMLDetailsElement | null }` → single-open (exclusive)
 * - `Set<HTMLDetailsElement>` → multi-open
 *
 * @example
 * ```tsx
 * const Accordion = (props: AccordionProps, env: AccordionEnv) => {
 *   const model = accordionModel(props, env)
 *   return (
 *     <details use:mount={model.onMount} {...model.details}>
 *       <summary>{props.summary}</summary>
 *       {props.children}
 *     </details>
 *   )
 * }
 * ```
 */
export function accordionModel(props: AccordionProps, env?: AccordionEnv): AccordionModel {
	let el: HTMLDetailsElement | undefined

	function syncGroupOpen(details: HTMLDetailsElement) {
		const group = env?.accordionGroup
		if (!group) return
		if (group instanceof Set) {
			if (details.open) group.add(details)
			else group.delete(details)
		} else {
			if (details.open) {
				const prev = group.value
				if (prev && prev !== details) prev.open = false
				group.value = details
			} else if (group.value === details) {
				group.value = null
			}
		}
	}

	const model: AccordionModel = {
		get onMount() {
			return (element: HTMLDetailsElement) => {
				el = element
			}
		},
		get details() {
			return {
				get open() {
					const group = env?.accordionGroup
					if (!group || !el) return props.open
					if (group instanceof Set) return group.has(el) || props.open
					return group.value === el || props.open
				},
				get onToggle() {
					return (e: Event) => {
						const details = e.currentTarget as HTMLDetailsElement
						props.onToggle?.(details.open)
						syncGroupOpen(details)
					}
				},
			}
		},
	}
	return model
}

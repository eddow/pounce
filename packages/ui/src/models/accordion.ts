import type { Env } from '@pounce/core'
import type { ElementPassthroughProps } from '../shared/types'
import { type GroupBinding, hasGroupValue, setGroupValue } from './group'
// TODO: we should have the accordionGroup component here - in components I mean, in `ui` - as it is a purely behavior-forwarding-children component
// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Reactive group variable injected by `AccordionGroup` into the env.
 * - `HTMLDetailsElement | null` → single-open (exclusive): at most one open at a time.
 * - `Set<HTMLDetailsElement>` / `HTMLDetailsElement[]` → multi-open: any subset can be open.
 */
export type AccordionGroupVar = GroupBinding<HTMLDetailsElement>

export type AccordionProps<Value = unknown> = ElementPassthroughProps<'details'> & {
	/** Controlled open state */
	open?: boolean
	/** Stable identity of this accordion item inside `group` */
	value?: Value
	/** Shared group state: single value (exclusive) or set/array (multi-open) */
	group?: GroupBinding<Value>
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
 * Grouping options:
 * - Pass `group` + `value` for value-based grouping (single or multi-open).
 * - Or wrap in `<AccordionGroup>` (adapter-provided), which injects `env.accordionGroup`
 *   using the same group semantics but keyed by mounted `HTMLDetailsElement`.
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

	function syncExplicitGroup(details: HTMLDetailsElement) {
		if (props.group === undefined || props.value === undefined) return
		props.group = setGroupValue(props.group, props.value, details.open)
	}

	function syncEnvGroup(details: HTMLDetailsElement) {
		if (env?.accordionGroup === undefined) return
		env.accordionGroup = setGroupValue(env.accordionGroup, details, details.open)
	}

	function isOpenByGroup(): boolean {
		if (props.group !== undefined && props.value !== undefined) {
			return hasGroupValue(props.group, props.value)
		}
		if (env?.accordionGroup !== undefined && el) {
			return hasGroupValue(env.accordionGroup, el)
		}
		return false
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
					if (props.group !== undefined && props.value !== undefined) {
						return isOpenByGroup() || props.open === true
					}
					if (env?.accordionGroup !== undefined && el) {
						return isOpenByGroup() || props.open === true
					}
					return props.open
				},
				get onToggle() {
					return (e: Event) => {
						const details = e.currentTarget as HTMLDetailsElement
						props.onToggle?.(details.open)
						syncExplicitGroup(details)
						syncEnvGroup(details)
					}
				},
			}
		},
	}
	return model
}

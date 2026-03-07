import { reactive } from 'mutts'
import type { VariantProps } from '../shared/types'

// ── Types ───────────────────────────────────────────────────────────────────

/** Props for {@link multiselectModel}. Generic over item type `T`. */
export type MultiselectProps<T> = VariantProps & {
	/** Available options. */
	items: T[]
	/** Selected items. */
	value: Set<T>
	/** Equality predicate for matching items in value. Defaults to Object.is. */
	equals?: (left: T, right: T) => boolean
	/** Called when the selection changes. */
	onChange?: (value: Set<T>) => void
	/** Renders each item. Return `false` to hide an item. */
	renderItem: (item: T, checked: boolean) => JSX.Element | false
	/** Close dropdown after each selection. @default true */
	closeOnSelect?: boolean
}

export type MultiselectItemState<T> = {
	/** The item value */
	readonly item: T
	/** Whether the item is currently selected */
	readonly checked: boolean
	/** Spreadable attrs for the row element */
	readonly el: JSX.IntrinsicElements['li']
	/** Rendered content — false means the item should be hidden */
	render: () => JSX.Element | false
	/** Toggle handler — call on item click */
	readonly toggle: (e: Event) => void
}

export type MultiselectModel<T> = {
	/** Per-item state — iterate to render the dropdown list */
	readonly items: MultiselectItemState<T>[]
	/** Spreadable attrs for the `<details>` element (no meta-attributes) */
	readonly details: JSX.IntrinsicElements['details']
	/** Spreadable attrs for the `<summary>` element */
	readonly summary: JSX.IntrinsicElements['summary'] & {
		readonly onClick: (e: MouseEvent) => void
	}
	/** Mount callback — pass to `use:mount` or call manually with the details element */
	readonly onMount: (el: HTMLDetailsElement) => void
}

function matchesItem<T>(props: MultiselectProps<T>, left: T, right: T): boolean {
	return props.equals ? props.equals(left, right) : Object.is(left, right)
}

function isSelected<T>(props: MultiselectProps<T>, value: Set<T>, item: T): boolean {
	return Array.from(value).some((selected) => matchesItem(props, selected, item))
}

function toggleSelected<T>(props: MultiselectProps<T>, value: Set<T>, item: T): Set<T> {
	const next = new Set<T>()
	let removed = false
	for (const selected of value) {
		if (!removed && matchesItem(props, selected, item)) {
			removed = true
			continue
		}
		next.add(selected)
	}
	if (!removed) next.add(item)
	return next
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Headless multi-select dropdown logic.
 *
 * Uses `<details>`/`<summary>` semantics. The adapter renders the trigger
 * (inside `<summary>`) and the item list (inside the dropdown).
 *
 * @example
 * ```tsx
 * const Multiselect = <T,>(props: MultiselectProps<T>) => {
 *   const model = multiselectModel(props)
 *   return (
 *     <details use:mount={model.onMount} {...model.details}>
 *       <summary {...model.summary}>{props.children}</summary>
 *       <ul>
 *         <for each={model.items}>
 *           {(item) => item.render() !== false && (
 *             <li {...item.el}>{item.render()}</li>
 *           )}
 *         </for>
 *       </ul>
 *     </details>
 *   )
 * }
 * ```
 */
export function multiselectModel<T>(props: MultiselectProps<T>): MultiselectModel<T> {
	let detailsEl: HTMLDetailsElement | undefined
	type MutableItemState = {
		item: T
		checked: boolean
		rendered: JSX.Element | false
		readonly el: JSX.IntrinsicElements['li']
		render: () => JSX.Element | false
		toggle: (e: Event) => void
	}
	const itemStates = new Map<T, MutableItemState>()

	const model: MultiselectModel<T> = {
		get items() {
			return props.items.map((item) => {
				const existing = itemStates.get(item)
				const checked = isSelected(props, props.value, item)
				if (existing) {
					existing.checked = checked
					existing.rendered = props.renderItem(item, checked)
					return existing
				}
				let state!: MutableItemState
				state = reactive<MutableItemState>({
					item,
					checked,
					rendered: props.renderItem(item, checked),
					get el(): JSX.IntrinsicElements['li'] {
						return {
							'aria-selected': state.checked,
							onClick: state.toggle,
						}
					},
					render: () => state.rendered,
					toggle: (e: Event) => {
						e.preventDefault()
						e.stopPropagation()
						const nextChecked = !state.checked
						state.checked = nextChecked
						state.rendered = props.renderItem(item, nextChecked)
						const next = toggleSelected(props, props.value, item)
						props.onChange?.(next)
						if ((props.closeOnSelect ?? true) && detailsEl) {
							detailsEl.open = false
						}
					},
				})
				itemStates.set(item, state)
				return state as MultiselectItemState<T>
			})
		},
		get details() {
			return {}
		},
		get onMount() {
			return (el: HTMLDetailsElement) => {
				detailsEl = el
			}
		},
		get summary() {
			return {
				get onClick() {
					return (e: MouseEvent) => {
						e.preventDefault()
						const details = (e.currentTarget as HTMLElement).closest(
							'details'
						) as HTMLDetailsElement | null
						if (details) details.open = !details.open
					}
				},
			}
		},
	}
	return model
}

// TODO: to review
// TODO: Hungry dog
import type { VariantProps } from '../shared/types'

// ── Types ───────────────────────────────────────────────────────────────────

/** Props for {@link multiselectModel}. Generic over item type `T`. */
export type MultiselectProps<T> = VariantProps & {
	/** Available options. */
	items: T[]
	/** Selected items (mutated in place on toggle). */
	value: Set<T>
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
	/** Rendered content — false means the item should be hidden */
	readonly rendered: JSX.Element | false
	/** Toggle handler — call on item click */
	readonly toggle: (e: Event) => void
}

export type MultiselectModel<T> = {
	/** Per-item state — iterate to render the dropdown list */
	readonly items: MultiselectItemState<T>[]
	/** Spreadable attrs for the `<details>` element */
	readonly details: JSX.IntrinsicElements['details'] & {
		readonly use: (el: HTMLDetailsElement) => void
	}
	/** Spreadable attrs for the `<summary>` element */
	readonly summary: JSX.IntrinsicElements['summary'] & {
		readonly onClick: (e: MouseEvent) => void
	}
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
 *     <details {...model.details}>
 *       <summary {...model.summary}>{props.children}</summary>
 *       <ul>
 *         <for each={model.items}>
 *           {(item) => item.rendered !== false && (
 *             <li aria-selected={item.checked} onClick={item.toggle}>{item.rendered}</li>
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

	const model: MultiselectModel<T> = {
		get items() {
			return props.items.map((item) => {
				const checked = props.value.has(item)
				return {
					item,
					checked,
					rendered: props.renderItem(item, checked),
					toggle: (e: Event) => {
						e.preventDefault()
						e.stopPropagation()
						if (props.value.has(item)) props.value.delete(item)
						else props.value.add(item)
						if ((props.closeOnSelect ?? true) && detailsEl) {
							detailsEl.open = false
						}
					},
				}
			})
		},
		get details() {
			return {
				get use() {
					return (el: HTMLDetailsElement) => {
						detailsEl = el
					}
				},
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

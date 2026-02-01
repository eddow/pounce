import { compose } from '@pounce/core'
import { css } from '@pounce/toolbox/entry-dom'
import type { Variant } from './variants'
import { variantClass } from './variants'

css`
.pp-multiselect {
	position: relative;
	display: inline-block;
}

.pp-multiselect > summary {
	list-style: none;
	cursor: pointer;
}

.pp-multiselect > summary::-webkit-details-marker,
.pp-multiselect > summary::marker,
.pp-multiselect > summary::after {
	display: none;
}

.pp-multiselect-menu {
	position: absolute;
	top: 100%;
	left: 0;
	margin-top: 0.5rem;
	min-width: 12rem;
	max-height: 300px;
	overflow-y: auto;
	background-color: var(--pico-card-background-color, #fff);
	border: 1px solid var(--pico-muted-border-color, rgba(0, 0, 0, 0.2));
	border-radius: var(--pico-border-radius, 0.5rem);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 1000;
	padding: 0;
	margin: 0;
}

.pp-multiselect-menu li {
	list-style: none;
	padding: 0.5rem 0.75rem;
	cursor: pointer;
	transition: background-color 0.15s ease;
	margin: 0;
}

.pp-multiselect-menu li:hover {
	background-color: color-mix(in srgb, var(--pico-primary, #3b82f6) 12%, transparent);
}

.pp-multiselect-menu li:active {
	background-color: color-mix(in srgb, var(--pico-primary, #3b82f6) 20%, transparent);
}

.pp-multiselect-primary .pp-multiselect-menu li:hover {
	background-color: color-mix(in srgb, var(--pico-primary, #3b82f6) 12%, transparent);
}

.pp-multiselect-secondary .pp-multiselect-menu li:hover {
	background-color: color-mix(in srgb, var(--pico-secondary, #64748b) 12%, transparent);
}

.pp-multiselect-success .pp-multiselect-menu li:hover {
	background-color: color-mix(in srgb, var(--pp-success, #22c55e) 12%, transparent);
}

.pp-multiselect-danger .pp-multiselect-menu li:hover {
	background-color: color-mix(in srgb, var(--pp-danger, #ef4444) 12%, transparent);
}

.pp-multiselect-warning .pp-multiselect-menu li:hover {
	background-color: color-mix(in srgb, var(--pp-warning, #f59e0b) 12%, transparent);
}

.pp-multiselect-contrast .pp-multiselect-menu li:hover {
	background-color: color-mix(in srgb, var(--pico-contrast, #0f172a) 12%, transparent);
}
`

export type MultiselectProps<T> = {
	/** Array of available items to select from */
	items: T[]

	/** Set containing selected items (two-way bound via babel-plugin-jsx-reactive) */
	value: Set<T>

	/**
	 * Renderer for each item in the dropdown list
	 * @param element - The item to render
	 * @param checked - Whether this item is currently selected
	 * @returns JSX.Element to render, or false to hide the item
	 */
	renderItem: (element: T, checked: boolean) => JSX.Element | false

	/** Whether to close the dropdown when an item is selected (default: true) */
	closeOnSelect?: boolean

	/** Visual variant for the dropdown */
	variant?: Variant

	/** Custom class for the dropdown container */
	class?: string

	/** Additional props for the details element */
	el?: JSX.IntrinsicElements['details']

	/** The trigger button/element (rendered as children) */
	children: JSX.Element
}

export const Multiselect = <T,>(props: MultiselectProps<T>) => {
	const state = compose(
		{
			closeOnSelect: true,
			variant: 'primary' as Variant,
		},
		props
	)
	let detailsEl: HTMLDetailsElement | undefined

	const handleItemClick = (item: T, event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()

		const currentlySelected = state.value.has(item)

		if (currentlySelected) {
			state.value.delete(item)
		} else {
			state.value.add(item)
		}

		// Close dropdown if closeOnSelect is true (default)
		const shouldClose = state.closeOnSelect
		if (shouldClose && detailsEl) {
			detailsEl.open = false
			detailsEl.removeAttribute('open')
		}
	}

	return (
		<details
			class={['pp-multiselect', variantClass(state.variant), state.class]}
			{...state.el}
			this={detailsEl}
		>
			<summary
				aria-haspopup="menu"
				onClick={(e) => {
					// Ensure clicks on nested elements (like our Button) still toggle the menu
					e.preventDefault()
					const details = (e.currentTarget as HTMLElement).closest('details')
					if (details) {
						details.open = !details.open
					}
				}}
			>
				{state.children}
			</summary>
			<ul role="listbox" aria-multiselectable="true" class="pp-multiselect-menu">
				<for each={state.items}>
					{(item: T) => {
						const checked = state.value.has(item)
						const rendered = state.renderItem(item, checked)
						if (rendered === false) return null
						return (
							<li
								role="option"
								aria-selected={checked}
								onClick={(e: MouseEvent) => handleItemClick(item, e)}
							>
								{rendered}
							</li>
						)
					}}
				</for>
			</ul>
		</details>
	)
}

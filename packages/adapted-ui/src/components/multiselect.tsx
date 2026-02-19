import { componentStyle } from '@pounce/kit'
import { getAdapter } from '../adapter/registry'
import { variantProps } from '../shared/variants'

componentStyle.sass`
.pounce-multiselect
	position: relative
	display: inline-block

	> summary
		list-style: none
		cursor: pointer

		&::-webkit-details-marker,
		&::marker,
		&::after
			display: none

.pounce-multiselect-menu
	position: absolute
	top: 100%
	left: 0
	margin-top: 0.5rem
	min-width: 12rem
	max-height: 300px
	overflow-y: auto
	background-color: var(--pounce-bg-card, #fff)
	border: 1px solid var(--pounce-border-color, rgba(0, 0, 0, 0.2))
	border-radius: var(--pounce-border-radius, 0.5rem)
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
	z-index: 1000
	padding: 0
	margin: 0

	li
		list-style: none
		padding: 0.5rem 0.75rem
		cursor: pointer
		transition: background-color 0.15s ease
		margin: 0

		&:hover
			background-color: color-mix(in srgb, var(--pounce-primary, #3b82f6) 12%, transparent)

		&:active
			background-color: color-mix(in srgb, var(--pounce-primary, #3b82f6) 20%, transparent)
`

/** Props for {@link Multiselect}. Generic over item type `T`. */
export type MultiselectProps<T> = {
	/** Available options. */
	items: T[]
	/** Selected items (mutated in place on toggle). */
	value: Set<T>
	/** Renders each item. Return `false` to hide an item. */
	renderItem: (element: T, checked: boolean) => JSX.Element | false
	/** Close dropdown after each selection. @default true */
	closeOnSelect?: boolean
	/** Variant name. @default 'primary' */
	variant?: string
	class?: string
	el?: JSX.IntrinsicElements['details']
	/** Trigger element rendered inside `<summary>`. */
	children: JSX.Element
}

/**
 * Dropdown multi-selection using `<details>`/`<summary>`.
 *
 * @example
 * ```tsx
 * <Multiselect items={colors} value={selected} renderItem={(c, on) => <span>{on ? '✓ ' : ''}{c}</span>}>
 *   <Button>Pick</Button>
 * </Multiselect>
 * ```
 *
 * Adapter key: `Multiselect` (BaseAdaptation)
 */
export const Multiselect = <T,>(props: MultiselectProps<T>) => {
	const adapter = getAdapter('Multiselect')
	let detailsEl: HTMLDetailsElement | undefined

	const handleItemClick = (item: T, event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()

		if (props.value.has(item)) {
			props.value.delete(item)
		} else {
			props.value.add(item)
		}

		if ((props.closeOnSelect ?? true) && detailsEl) {
			detailsEl.open = false
			detailsEl.removeAttribute('open')
		}
	}

	return (
		<details
			{...variantProps(props.variant)}
			{...props.el}
			class={[adapter.classes?.base || 'pounce-multiselect', props.class]}
			this={detailsEl}
		>
			<summary
				aria-haspopup="menu"
				onClick={(e) => {
					e.preventDefault()
					const details = (e.currentTarget as HTMLElement).closest('details')
					if (details) details.open = !details.open
				}}
			>
				{props.children}
			</summary>
			<ul
				role="listbox"
				aria-multiselectable="true"
				class={adapter.classes?.menu || 'pounce-multiselect-menu'}
			>
				<for each={props.items}>
					{(item: T) => {
						const checked = props.value.has(item)
						const rendered = props.renderItem(item, checked)
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

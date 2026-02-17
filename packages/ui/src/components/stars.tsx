import { project, reactive } from 'mutts'
import { componentStyle } from '@pounce/kit'
import { getAdapter } from '../adapter/registry'
import { Icon } from './icon'

componentStyle.sass`
.pounce-stars
	display: inline-flex
	align-items: center
	gap: 0.125rem
	cursor: pointer
	user-select: none

	&.pounce-readonly
		cursor: default

		.pounce-stars-item:hover
			transform: none

.pounce-stars-item
	display: inline-flex
	align-items: center
	justify-content: center
	color: var(--pounce-fg-muted, #888)
	transition: color 0.1s ease, transform 0.1s ease

	&:hover
		transform: scale(1.1)

	&.pounce-before
		color: var(--pounce-primary, #f59e0b)

	&.pounce-inside
		color: inherit
`

/** Props for {@link Stars}. */
export type StarsProps = {
	/** Current rating — single number or `[min, max]` range. */
	value: number | readonly [number, number]
	/** Number of stars to display. @default 5 */
	maximum?: number
	/** Called when the user changes the value. */
	onChange?: (value: number | readonly [number, number]) => void
	/** Disable interaction. @default false */
	readonly?: boolean
	/** Icon size (CSS value). @default '1.5rem' */
	size?: string
	/** Icon name for range interior stars (defaults to `before`). */
	inside?: string
	/** Icon name for empty stars. @default 'star-outline' */
	after?: string
	/** Icon name for filled stars. @default 'star-filled' */
	before?: string
	/** Icon name for the "zero" position (rendered before star 1). */
	zeroElement?: string
}

/**
 * Star rating with single value or range selection.
 *
 * Click to set value. Drag to adjust range endpoints. Double-click to collapse range.
 *
 * @example
 * ```tsx
 * <Stars value={3} onChange={setRating} />
 * <Stars value={[2, 4]} maximum={10} />
 * <Stars value={5} readonly />
 * ```
 *
 * Adapter key: `Stars` (BaseAdaptation)
 */
export const Stars = (props: StarsProps) => {
	const adapter = getAdapter('Stars')

	const local = reactive({ value: props.value ?? (0 as number | readonly [number, number]) })
	const internal = reactive({ draggingEnd: null as 'min' | 'max' | null })

	function set(val: number | readonly [number, number]) {
		if (
			local.value !== val &&
			(typeof val === 'number' ||
				typeof local.value === 'number' ||
				val[0] !== local.value[0] ||
				val[1] !== local.value[1])
		) {
			local.value = val
			props.onChange?.(val)
		}
	}

	const handleInteraction = (index: number, e: MouseEvent) => {
		if (props.readonly) return
		const isLeftClick = e.type === 'mousedown' && e.button === 0
		const isLeftDrag = e.type === 'mousemove' && (e.buttons & 1) === 1
		if (!isLeftClick && !isLeftDrag) return

		let val: number | readonly [number, number] = index + 1

		if (Array.isArray(local.value)) {
			const [min, max] = local.value
			if (!internal.draggingEnd) {
				if (val < min) {
					internal.draggingEnd = 'min'
				} else if (val > max) {
					internal.draggingEnd = 'max'
				} else {
					const distMin = val - min
					const distMax = max - val
					if (distMin < distMax) {
						internal.draggingEnd = 'min'
					} else if (distMax < distMin) {
						internal.draggingEnd = 'max'
					} else {
						const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
						const clickX = e.clientX - rect.left
						internal.draggingEnd = clickX < rect.width / 2 ? 'min' : 'max'
					}
				}
			}
			const [newMin, newMax] = [Math.min(val, min), Math.max(val, max)]
			if (internal.draggingEnd === 'min') {
				set([val, Math.max(val, max)])
			} else if (internal.draggingEnd === 'max') {
				set([Math.min(val, min), val])
			} else {
				set([newMin, newMax])
			}
		} else {
			set(index + 1)
		}
	}

	const handleDblClick = (index: number) => {
		if (props.readonly) return
		if (Array.isArray(local.value)) {
			const val = index + 1
			set([val, val])
		}
	}

	const handleMouseUp = () => { internal.draggingEnd = null }

	const renderStarItem = (index: number) => {
		const status = () => {
			const [min, max] = Array.isArray(local.value) ? local.value : [local.value, local.value]
			const val = index + 1
			if (val === 0) return 'zero'
			if (val <= min) return 'before'
			if (val <= max) return 'inside'
			return 'after'
		}

		return (
			<span
				class={[adapter.classes?.item || 'pounce-stars-item', `pounce-${status()}`]}
				onMousedown={(e: MouseEvent) => handleInteraction(index, e)}
				onMousemove={(e: MouseEvent) => handleInteraction(index, e)}
				onDblclick={() => handleDblClick(index)}
			>
				<Icon
					name={
						index === -1
							? props.zeroElement!
							: status() === 'inside'
								? (props.inside ?? (props.before ?? 'star-filled'))
								: status() === 'before'
									? (props.before ?? 'star-filled')
									: (props.after ?? 'star-outline')
					}
					size={props.size ?? '1.5rem'}
				/>
			</span>
		)
	}

	return (
		<div
			class={[adapter.classes?.base || 'pounce-stars', props.readonly ? 'pounce-readonly' : undefined]}
			onMouseup={handleMouseUp}
			onMouseleave={handleMouseUp}
		>
			{props.zeroElement && renderStarItem(-1)}
			{project(Array.from({ length: props.maximum ?? 5 }).map((_, i) => i), ({ value }) => renderStarItem(value))}
		</div>
	)
}

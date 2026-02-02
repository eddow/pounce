import { project } from 'mutts'
import { compose } from '@pounce/core'
import { tablerFilledStar, tablerOutlineStar } from 'pure-glyf/icons'
import { css } from '@pounce/kit'
import { Icon } from './icon'

css`
.pp-stars {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    cursor: pointer;
    user-select: none;
}

.pp-stars-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--pico-muted-color, #888);
    transition: color 0.1s ease, transform 0.1s ease;
}

.pp-stars-item:hover {
    transform: scale(1.1);
}

.pp-stars-item.pp-before {
    color: var(--pico-primary, #f59e0b);
}

.pp-stars-item.pp-inside {
    color: inherit;
}

.pp-stars.pp-readonly {
    cursor: default;
}
.pp-stars.pp-readonly .pp-stars-item:hover {
    transform: none;
}
`

export type StarsProps = {
	/** Current value (number of stars filled) */
	value: number | readonly [number, number]
	/** Maximum number of stars, defaults to 5 */
	maximum?: number
	/** Callback when value changes */
	onChange?: (value: any) => void
	/** If true, user cannot interact */
	readonly?: boolean
	/** Size of the stars, defaults to "1.5rem" */
	size?: string
	/** Icon name for filled state, defaults to TablerFilledStar */
	inside?: string
	/** Icon name for empty state, defaults to TablerOutlineStar */
	after?: string
	/** Icon name for before state (stars before the range), defaults to outside icon if not set */
	before?: string
	/** Icon name for the 0-th element (optional). If set, allows value 0. */
	zeroElement?: string
}

export const Stars = (props: StarsProps) => {
	const state = compose(
		{
			value: 0 as number | readonly [number, number],
			maximum: 5,
			readonly: false,
			size: '1.5rem',
			inside: undefined as string | undefined,
			after: tablerOutlineStar,
			before: tablerFilledStar,
			zeroElement: undefined as string | undefined,
		},
		props
	)

	const internal = compose({
		draggingEnd: null as 'min' | 'max' | null,
	})
	function set(val: number | readonly [number, number]) {
		if (
			state.value !== val &&
			(typeof val === 'number' ||
				typeof state.value === 'number' ||
				val[0] !== state.value[0] ||
				val[1] !== state.value[1])
		) {
			state.value = val
			state.onChange?.(val)
		}
	}

	const handleInteraction = (index: number, e: MouseEvent) => {
		if (state.readonly) return
		const isLeftClick = e.type === 'mousedown' && e.button === 0
		const isLeftDrag = e.type === 'mousemove' && (e.buttons & 1) === 1

		if (!isLeftClick && !isLeftDrag) return

		let val: number | readonly [number, number] = index + 1

		if (Array.isArray(state.value)) {
			let [min, max] = state.value
			if (!internal.draggingEnd) {
				if (val < min) {
					internal.draggingEnd = 'min'
				} else if (val > max) {
					internal.draggingEnd = 'max'
				} else {
					// Inside range: pick closer end
					const distMin = val - min
					const distMax = max - val
					if (distMin < distMax) {
						internal.draggingEnd = 'min'
					} else if (distMax < distMin) {
						internal.draggingEnd = 'max'
					} else {
						// Middle: check click position within star
						const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
						const clickX = e.clientX - rect.left
						internal.draggingEnd = clickX < rect.width / 2 ? 'min' : 'max'
					}
				}
			}
			let [newMin, newMax] = [Math.min(val, min), Math.max(val, max)]

			if (internal.draggingEnd === 'min') {
				newMin = val
			} else if (internal.draggingEnd === 'max') {
				newMax = val
			}
			set([newMin, newMax])
		} else set(index + 1)
	}

	const handleDblClick = (index: number) => {
		if (state.readonly) return
		if (Array.isArray(state.value)) {
			const val = index + 1
			set([val, val])
		}
	}

	const handleMouseUp = () => {
		internal.draggingEnd = null
	}
	// Helper to render a star item
	const renderStarItem = (index: number) => {
		const status = () => {
			const [min, max] = Array.isArray(state.value) ? state.value : [state.value, state.value]
			// Value represented by this item
			const val = index + 1
			if (val === 0) return 'zero'
			if (val <= min) return 'before'
			if (val <= max) return 'inside'
			return 'after'
		}

		return (
			<span
				class={['pp-stars-item', `pp-${status()} `]}
				onMousedown={(e: MouseEvent) => handleInteraction(index, e)}
				onMousemove={(e: MouseEvent) => handleInteraction(index, e)}
				onDblclick={() => handleDblClick(index)}
			>
				<Icon
					icon={
						index === -1
							? state.zeroElement!
							: status() === 'inside'
								? (state.inside ?? state.before)
								: status() === 'before'
									? state.before
									: state.after
					}
					size={state.size}
				/>
			</span>
		)
	}

	return (
		<div
			class={['pp-stars', state.readonly ? 'pp-readonly' : undefined]}
			onMouseup={handleMouseUp}
			onMouseleave={handleMouseUp}
		>
			{state.zeroElement && renderStarItem(-1)}
			{project(Array.from({ length: state.maximum }).map((_, i) => i), ({ value }) => renderStarItem(value))}
		</div>
	)
}

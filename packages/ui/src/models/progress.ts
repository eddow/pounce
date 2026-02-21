// TODO: to review
// TODO: Hungry dog
import type { ElementPassthroughProps, VariantProps } from '../shared/types'

// ── Types ───────────────────────────────────────────────────────────────────

export type ProgressProps = VariantProps &
	ElementPassthroughProps<'progress'> & {
		/** Current value. Omit for indeterminate mode. */
		value?: number
		/** Maximum value. @default 100 */
		max?: number
	}

export type ProgressModel = {
	/** True when value is undefined (indeterminate spinner) */
	readonly isIndeterminate: boolean
	/** Spreadable attrs for the `<progress>` element */
	readonly progress: JSX.IntrinsicElements['progress'] & {
		readonly value: number | undefined
		readonly max: number
		readonly 'aria-valuenow': number | undefined
		readonly 'aria-valuemin': 0
		readonly 'aria-valuemax': number
	}
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Headless progress bar logic.
 *
 * Handles indeterminate detection and aria attributes.
 * The adapter renders a native `<progress>` element.
 *
 * @example
 * ```tsx
 * const Progress = (props: ProgressProps) => {
 *   const model = progressModel(props)
 *   return (
 *     <progress {...model.progress} role="progressbar" />
 *   )
 * }
 * ```
 */
export function progressModel(props: ProgressProps): ProgressModel {
	const model: ProgressModel = {
		get isIndeterminate() {
			return props.value === undefined || props.value === null
		},
		get progress() {
			return {
				get value() {
					return model.isIndeterminate ? undefined : props.value
				},
				get max() {
					return props.max ?? 100
				},
				get 'aria-valuenow'() {
					return model.isIndeterminate ? undefined : props.value
				},
				'aria-valuemin': 0 as const,
				get 'aria-valuemax'() {
					return props.max ?? 100
				},
			}
		},
	}
	return model
}

import type { ElementPassthroughProps, VariantProps } from './shared/types'

// ── Types ───────────────────────────────────────────────────────────────────

export type ProgressProps = VariantProps &
	ElementPassthroughProps<'progress'> & {
		/** Current value. Omit for indeterminate mode. */
		value?: number
		/** Maximum value. @default 100 */
		max?: number
	}

export type ProgressState = {
	/** True when value is undefined (indeterminate spinner) */
	readonly isIndeterminate: boolean
	/** Resolved value — undefined when indeterminate */
	readonly value: number | undefined
	/** Resolved max — defaults to 100 */
	readonly max: number
	/** aria attributes to spread onto the progress element */
	readonly ariaProps: {
		'aria-valuenow': number | undefined
		'aria-valuemin': 0
		'aria-valuemax': number
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
 *   const state = useProgress(props)
 *   return (
 *     <progress value={state.value} max={state.max} role="progressbar" {...state.ariaProps} />
 *   )
 * }
 * ```
 */
export function useProgress(props: ProgressProps): ProgressState {
	return {
		get isIndeterminate() {
			return props.value === undefined || props.value === null
		},
		get value() {
			return this.isIndeterminate ? undefined : props.value
		},
		get max() {
			return props.max ?? 100
		},
		get ariaProps() {
			return {
				'aria-valuenow': this.isIndeterminate ? undefined : props.value,
				'aria-valuemin': 0 as const,
				'aria-valuemax': this.max,
			}
		},
	}
}

import { reactive } from 'mutts'
import type { ElementPassthroughProps, IconProps, VariantProps } from '../shared/types'

// ── Chip ─────────────────────────────────────────────────────────────────────

export type ChipProps = VariantProps &
	IconProps &
	ElementPassthroughProps<'button'> & {
		/** Dynamic element tag. @default 'button' */
		tag?: string
		/** Show a dismiss (×) button. @default false */
		dismissible?: boolean
		/** Accessible label for the dismiss button. @default 'Remove' */
		dismissLabel?: string
		/** Called when the chip is dismissed. */
		onDismiss?: () => void
		children?: JSX.Children
	}

export type ChipModel = {
	/** Resolved element tag */
	readonly tag: string
	/** Whether the chip is currently visible (false after dismiss) */
	readonly isVisible: boolean
	/** Whether the chip is dismissible */
	readonly dismissible: boolean
	/** Accessible label for the dismiss button */
	readonly dismissLabel: string
	/** Call to dismiss the chip — sets isVisible to false and calls onDismiss */
	readonly dismiss: () => void
}

/**
 * Headless chip logic.
 *
 * Owns the internal `isVisible` state. The adapter renders the dismiss button
 * and calls `model.dismiss()` when clicked.
 *
 * @example
 * ```tsx
 * const Chip = (props: ChipProps) => {
 *   const model = chipModel(props)
 *   return (
 *     <dynamic if={model.isVisible} tag={model.tag} class="chip" {...props.el}>
 *       {props.icon && <Icon name={props.icon} />}
 *       <span>{props.children}</span>
 *       <button if={model.dismissible} onClick={model.dismiss} aria-label={model.dismissLabel}>×</button>
 *     </dynamic>
 *   )
 * }
 * ```
 */
export function chipModel(props: ChipProps): ChipModel {
	const state = reactive({ visible: true })

	const model: ChipModel = {
		get tag() {
			return props.tag ?? 'button'
		},
		get isVisible() {
			return state.visible
		},
		get dismissible() {
			return props.dismissible ?? false
		},
		get dismissLabel() {
			return props.dismissLabel ?? 'Remove'
		},
		get dismiss() {
			return () => {
				state.visible = false
				props.onDismiss?.()
			}
		},
	}
	return model
}

import { type Child } from '@pounce/core'

/**
 * Supported overlay modes that determine stacking and layout behavior.
 * These typically map to CSS classes and layer names.
 */
export type OverlayMode = string

/**
 * An overlay specification returned by an interactor's .show() method.
 */
export interface OverlaySpec<T = any> {
	/** Unique ID for tracking. If not provided, one will be generated. */
	id?: string
	/** Stacking and layout behavior. */
	mode: OverlayMode
	/** Function that renders the overlay content. */
	render: (close: (value: T) => void) => Child
	/** Whether the overlay can be dismissed by backdrop click or Escape. Default depends on interactor. */
	dismissible?: boolean
	/** Optional A11y labels */
	aria?: {
		label?: string
		labelledby?: string
		describedby?: string
	}
	/** Optional data passed to the interactor. */
	options?: any
}

/**
 * Internal entry in the overlay stack.
 */
export interface OverlayEntry extends OverlaySpec {
	id: string
	resolve: (value: any) => void
}

/**
 * Function type for pushing an overlay to a manager.
 */
export type PushOverlayFunction = <T>(spec: OverlaySpec<T>) => Promise<T | null>

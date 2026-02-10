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
	render: (close: (value: T) => void) => JSX.Children
	/** Whether the overlay can be dismissed by backdrop click or Escape. Default depends on interactor. */
	dismissible?: boolean
	/** 
	 * Auto-focus behavior when overlay opens.
	 * - `true`: Smart default (first focusable element)
	 * - `false`: No auto-focus
	 * - `string`: CSS selector or strategy ('first-button', 'first-input', 'container')
	 * Default: `true` for modal/drawer, `false` for toast
	 */
	autoFocus?: boolean | string
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
	closing?: boolean
}

/**
 * Function type for pushing an overlay to a manager.
 */
export type PushOverlayFunction = <T>(spec: OverlaySpec<T>) => Promise<T | null>

/**
 * Well-known overlay helper functions injected into component scope.
 * This interface can be extended via declaration merging by overlay implementations.
 * 
 * @example
 * ```typescript
 * // In dialog.tsx
 * declare module './manager' {
 *   interface OverlayHelpers {
 *     dialog: ReturnType<typeof bindDialog>
 *   }
 * }
 * ```
 */
export interface OverlayHelpers {
	overlay: PushOverlayFunction
}

/**
 * Transition configuration for enter/exit animations
 */
export type TransitionConfig = {
	enterClass?: string
	exitClass?: string
	activeClass?: string
	duration?: number
}

/**
 * Icon placement options
 */
export type IconPlacement = 'start' | 'end' | 'both' | 'none'

/**
 * Component parts for custom rendering
 */
export type ComponentParts<Props = any> = {
	props: Props
	state: any
	children: JSX.Element | JSX.Element[]
	ariaProps: Record<string, any>
	[key: string]: any
}

/**
 * Configuration for a single component
 */
export type ComponentAdapter<Props = any> = {
	/** CSS class name overrides */
	classes?: Partial<Record<string, string>>

	/** Custom render structure (for complex DOM changes) */
	renderStructure?: (parts: ComponentParts<Props>) => JSX.Element

	/** Event target overrides (for delegation patterns) */
	events?: Partial<Record<string, EventTarget>>

	/** Transition class configuration */
	transitions?: TransitionConfig

	/** Icon placement strategy */
	iconPlacement?: IconPlacement

	/** Icon resolver function */
	iconResolver?: (name: string, size?: string | number) => JSX.Element

	/** Icon name overrides for component-specific icons */
	icons?: Record<string, string>
}

/**
 * Framework adapter registry
 */
export type FrameworkAdapter = {
	[ComponentName: string]: ComponentAdapter
}


/**
 * Registry of all UI components exported by pounce/ui
 * This ensures type safety for adapter component keys
 */
export type UiComponents = {
	Button: any
	Badge: any
	Dialog: any
	Dockview: any
	ErrorBoundary: any
	Layout: any
	Menu: any
	RadioButton: any
	Toolbar: any
	Typography: any
	Heading: any
	Text: any
	Link: any
}

export type ComponentName = keyof UiComponents

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
	/** CSS class name overrides (additive to global variants) */
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
 * Framework adapter registry with global variants and per-component adapters
 */
export type FrameworkAdapter = {
	/** Global variant classes applied to all components */
	variants?: Record<string, string>

	/** Per-component adapters (additive to global variants) */
	components?: {
		[Name in keyof UiComponents]?: ComponentAdapter
	}
}

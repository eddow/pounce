
/**
 * Base adaptation type - common fields for all components
 */
export type BaseAdaptation = {
	/** CSS class name overrides */
	classes?: Partial<Record<string, string>>

	/** Custom render structure (for complex DOM changes) */
	renderStructure?: (parts: ComponentParts<any>) => JSX.Element
}

/**
 * Adaptation for components with icon support (Button, RadioButton)
 */
export type IconAdaptation = BaseAdaptation & {
	/** Icon placement strategy */
	iconPlacement?: 'start' | 'end'
}

/**
 * Adaptation for components with transitions (Dialog, Toast, Drawer, Alert)
 */
export type TransitionAdaptation = BaseAdaptation & {
	/** Transition class configuration */
	transitions?: TransitionConfig
}

/**
 * Adaptation for overlay components (Dialog, Toast, Drawer, Alert)
 */
export type OverlayAdaptation = TransitionAdaptation & {
	/** Event target overrides (for delegation patterns) */
	events?: Partial<Record<string, EventTarget>>
}

/**
 * Registry of all UI components with their specific adaptation types
 * This ensures type safety for adapter component keys
 */
export type UiComponents = {
	Button: IconAdaptation
	Badge: BaseAdaptation
	Dialog: OverlayAdaptation
	Dockview: BaseAdaptation
	ErrorBoundary: BaseAdaptation
	Layout: BaseAdaptation
	Menu: BaseAdaptation
	RadioButton: IconAdaptation
	Toolbar: BaseAdaptation
	Typography: BaseAdaptation
	Heading: BaseAdaptation
	Text: BaseAdaptation
	Link: BaseAdaptation
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
 * @deprecated Use component-specific adaptation types from UiComponents instead
 */
export type ComponentAdapter = BaseAdaptation

/**
 * Framework adapter registry with global configuration and per-component adapters
 */
export type FrameworkAdapter = {
	/** Global icon factory - used by all components with icon support */
	iconFactory?: (name: string, size?: string | number) => JSX.Element

	/** Global variant classes applied to all components */
	variants?: Record<string, string>

	/** Global transition defaults (can be overridden per-component) */
	transitions?: TransitionConfig

	/** Per-component adapters (typed to each component's needs) */
	components?: {
		[Name in keyof UiComponents]?: UiComponents[Name]
	}
}

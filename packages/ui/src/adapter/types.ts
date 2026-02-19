import type { Env } from "@pounce/core"

export type DisplayContext = Env

/**
 * Display context - presentation concerns available from env.
 * Separate from adapter (styling) concerns.
 * Provided by DisplayProvider, read via useDisplayContext().
 */

/**
 * Base adaptation type - common fields for all components
 */
export type BaseAdaptation = {
	/** CSS class name overrides */
	classes?: Partial<Record<string, string>>

	/** Custom render structure (for complex DOM changes) */
	renderStructure?: (parts: ComponentParts<any>, context: DisplayContext) => JSX.Element
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
 * Adaptation for Toolbar — orientation class is a function of direction
 */
export type ToolbarAdaptation = {
	classes?: {
		[key: string]: string | ((dir: 'horizontal' | 'vertical') => string) | undefined
		root?: string
		spacer?: string
		spacerVisible?: string
		orientation?: (dir: 'horizontal' | 'vertical') => string
	}
	renderStructure?: BaseAdaptation['renderStructure']
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
	Accordion: BaseAdaptation
	Badge: BaseAdaptation
	Button: IconAdaptation
	ButtonGroup: BaseAdaptation
	Card: BaseAdaptation
	CheckButton: IconAdaptation
	Checkbox: BaseAdaptation
	Chip: BaseAdaptation
	Combobox: BaseAdaptation
	Dialog: OverlayAdaptation
	Dockview: BaseAdaptation
	Drawer: OverlayAdaptation
	ErrorBoundary: BaseAdaptation
	Heading: BaseAdaptation
	InfiniteScroll: BaseAdaptation
	Layout: BaseAdaptation
	Link: BaseAdaptation
	Loading: BaseAdaptation
	Menu: BaseAdaptation
	Multiselect: BaseAdaptation
	Pill: BaseAdaptation
	Progress: BaseAdaptation
	Radio: BaseAdaptation
	RadioButton: IconAdaptation
	Select: BaseAdaptation
	Stars: BaseAdaptation
	Switch: BaseAdaptation
	Text: BaseAdaptation
	Toast: OverlayAdaptation
	Toolbar: ToolbarAdaptation
	Typography: BaseAdaptation
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
	state: Record<string, unknown>
	children: JSX.Children
	ariaProps: Record<string, string | boolean | undefined>
}

/**
 * @deprecated Use component-specific adaptation types from UiComponents instead
 */
export type ComponentAdapter = BaseAdaptation

/**
 * Framework adapter registry with global configuration and per-component adapters
 * 
 * Supports composable adapters - multiple setAdapter() calls merge configurations.
 * Each adapter can fulfill one or more orthogonal concerns:
 * - Icons: Icon rendering system
 * - Variants: Styling + A11y (JSX-spreadable attribute bags)
 * - Components: Per-component structure + classes
 * - Transitions: Animation system
 * 
 * Note: Display concerns (theme, direction, locale) are handled separately via
 * DisplayContext (env-based), not adapters. See display-context.tsx.
 */
export type FrameworkAdapter = {
	/** 
	 * Global icon factory - used by all components with icon support
	 * Receives display context for theme-aware, direction-aware icons
	 */
	iconFactory?: (name: string, size: string | number | undefined, context: DisplayContext) => JSX.Element

	/** Global variant attribute bags (class, style, data-*, aria-*, …) */
	variants?: Record<string, JSX.GlobalHTMLAttributes>

	/** Global transition defaults (can be overridden per-component) */
	transitions?: TransitionConfig

	/** Per-component adapters (typed to each component's needs) */
	components?: {
		[Name in keyof UiComponents]?: UiComponents[Name]
	}
}

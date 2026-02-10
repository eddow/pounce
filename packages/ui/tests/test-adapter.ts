/**
 * Reusable test adapter for @pounce/ui unit tests.
 * 
 * Provides a minimal but complete FrameworkAdapter covering all orthogonal concerns:
 * - Variants (as Trait objects with classes, attributes, styles)
 * - Transitions (global defaults + per-component overrides)
 * - Component adaptations (class overrides for key components)
 * 
 * Usage:
 *   import { installTestAdapter, TEST_VARIANTS, TEST_TRANSITIONS } from '../test-adapter'
 *   beforeEach(() => installTestAdapter())
 *   afterEach(() => resetAdapter())
 */
import type { FrameworkAdapter } from '../src/adapter/types'
import type { Trait } from '@pounce/core'
import { setAdapter, resetAdapter } from '../src/adapter/registry'

// --- Variant Traits ---

export const TEST_VARIANTS: Record<string, Trait> = {
	primary: {
		classes: ['test-primary'],
		attributes: { 'data-variant': 'primary' },
	},
	secondary: {
		classes: ['test-secondary'],
		attributes: { 'data-variant': 'secondary' },
	},
	success: {
		classes: ['test-success'],
		attributes: { 'data-variant': 'success', 'aria-live': 'polite' },
	},
	danger: {
		classes: ['test-danger'],
		attributes: { 'data-variant': 'danger', 'aria-live': 'assertive' },
	},
	warning: {
		classes: ['test-warning'],
		attributes: { 'data-variant': 'warning' },
	},
}

// --- Transition Configs ---

export const TEST_TRANSITIONS = {
	global: { duration: 200, enterClass: 'test-enter', exitClass: 'test-exit', activeClass: 'test-active' },
	dialog: { duration: 250, enterClass: 'test-dialog-enter', exitClass: 'test-dialog-exit' },
	toast: { duration: 150, enterClass: 'test-toast-enter', exitClass: 'test-toast-exit' },
	drawer: { duration: 300, enterClass: 'test-drawer-enter', exitClass: 'test-drawer-exit' },
}

// --- Full Test Adapter ---

export const TEST_ADAPTER: FrameworkAdapter = {
	variants: TEST_VARIANTS,
	transitions: TEST_TRANSITIONS.global,
	components: {
		Accordion: { classes: { base: 'test-accordion', summary: 'test-accordion-summary', content: 'test-accordion-content', group: 'test-accordion-group' } },
		Badge: { classes: { base: 'test-badge', label: 'test-badge-label' } },
		Button: { classes: { base: 'test-btn' } },
		ButtonGroup: { classes: { base: 'test-btngroup', horizontal: 'test-btngroup-h', vertical: 'test-btngroup-v' } },
		Card: { classes: { base: 'test-card', header: 'test-card-header', body: 'test-card-body', footer: 'test-card-footer' } },
		CheckButton: { classes: { base: 'test-checkbtn', checked: 'test-checkbtn-checked', icon: 'test-checkbtn-icon', label: 'test-checkbtn-label' } },
		Checkbox: { classes: { base: 'test-control', input: 'test-control-input', label: 'test-control-label', copy: 'test-control-copy' } },
		Chip: { classes: { base: 'test-chip', label: 'test-chip-label', dismiss: 'test-chip-dismiss' } },
		Combobox: { classes: { base: 'test-combobox' } },
		Dialog: {
			classes: { base: 'test-dialog' },
			transitions: TEST_TRANSITIONS.dialog,
		},
		Dockview: { classes: { base: 'test-dockview' } },
		Drawer: {
			classes: { base: 'test-drawer' },
			transitions: TEST_TRANSITIONS.drawer,
		},
		ErrorBoundary: { classes: { base: 'test-error-boundary' } },
		Heading: { classes: { base: 'test-heading' } },
		InfiniteScroll: { classes: { base: 'test-infinite', content: 'test-infinite-content', item: 'test-infinite-item' } },
		Layout: {
			classes: { base: 'test-stack', inline: 'test-inline', grid: 'test-grid', container: 'test-container' },
		},
		Link: { classes: { base: 'test-link' } },
		Menu: { classes: { dropdown: 'test-dropdown', barMobile: 'test-menu-mobile', barDesktop: 'test-menu-desktop' } },
		Multiselect: { classes: { base: 'test-multiselect', menu: 'test-multiselect-menu' } },
		Pill: { classes: { base: 'test-pill', label: 'test-pill-label' } },
		Progress: { classes: { base: 'test-progress' } },
		Radio: { classes: { base: 'test-control', input: 'test-control-input', label: 'test-control-label', copy: 'test-control-copy' } },
		RadioButton: { classes: { base: 'test-radiobtn', checked: 'test-radiobtn-checked', iconOnly: 'test-radiobtn-icon-only' } },
		Select: { classes: { base: 'test-select', full: 'test-select-full' } },
		Stars: { classes: { base: 'test-stars', item: 'test-stars-item' } },
		Switch: { classes: { base: 'test-control', input: 'test-control-input', label: 'test-control-label', copy: 'test-control-copy' } },
		Text: { classes: { base: 'test-text' } },
		Toolbar: { classes: { root: 'test-toolbar', spacer: 'test-toolbar-spacer', spacerVisible: 'test-toolbar-spacer-visible' } },
		Toast: {
			classes: { base: 'test-toast' },
			transitions: TEST_TRANSITIONS.toast,
		},
	},
}

/**
 * Install the test adapter. Call in beforeEach().
 * Pair with resetAdapter() in afterEach().
 */
export function installTestAdapter(): void {
	setAdapter(TEST_ADAPTER)
}

export { resetAdapter }

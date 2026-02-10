import type { UiComponents } from '@pounce/ui'

/**
 * PicoCSS per-component adapter configurations.
 *
 * Only components where Pico has specific opinions get overrides.
 * Components not listed here use @pounce/ui's vanilla defaults.
 *
 * PicoCSS v2 key behaviors:
 * - Buttons: styled natively via `<button>`, no base class needed
 * - Forms: `<select>`, `<input>`, `<label>` styled natively
 * - Dropdowns: `<details class="dropdown">` pattern
 * - Typography: semantic elements (h1–h6, p, a) styled natively
 * - Tokens (Badge/Pill/Chip): need Pico color integration via bridge CSS
 */

export const picoComponents: {
	[K in keyof UiComponents]?: UiComponents[K]
} = {
	// ── Card ─────────────────────────────────────────────────────────────
	// Pico styles <article> natively as a card with <header>/<footer>.

	Card: {
		classes: {
			base: 'pounce-card',
			header: 'pounce-card-header',
			body: 'pounce-card-body',
			footer: 'pounce-card-footer'
		}
	},

	// ── Progress ─────────────────────────────────────────────────────────
	// Pico styles <progress> natively (determinate + indeterminate).

	Progress: {
		classes: {
			base: 'pounce-progress'
		}
	},

	// ── Accordion ────────────────────────────────────────────────────────
	// Pico styles <details>/<summary> natively as an accordion.

	Accordion: {
		classes: {
			base: 'pounce-accordion',
			summary: 'pounce-accordion-summary',
			content: 'pounce-accordion-content',
			group: 'pounce-accordion-group'
		}
	},

	// ── Buttons ──────────────────────────────────────────────────────────

	Button: {
		classes: {
			base: 'pounce-button',
			iconOnly: 'pounce-button-icon-only'
		},
		iconPlacement: 'start'
	},

	CheckButton: {
		classes: {
			base: 'pounce-checkbutton',
			checked: 'pounce-checkbutton-checked',
			icon: 'pounce-checkbutton-icon',
			label: 'pounce-checkbutton-label',
			iconOnly: 'pounce-checkbutton-icon-only'
		},
		iconPlacement: 'start'
	},

	RadioButton: {
		classes: {
			base: 'pounce-radiobutton',
			checked: 'pounce-radiobutton-checked',
			iconOnly: 'pounce-radiobutton-icon-only'
		},
		iconPlacement: 'start'
	},

	ButtonGroup: {
		classes: {
			base: 'pounce-buttongroup',
			horizontal: 'pounce-buttongroup-horizontal',
			vertical: 'pounce-buttongroup-vertical'
		}
	},

	// ── Forms ────────────────────────────────────────────────────────────

	Select: {
		classes: {
			base: 'pounce-select',
			full: 'pounce-select-full'
		}
	},

	Combobox: {
		classes: {
			base: 'pounce-combobox'
		}
	},

	Checkbox: {
		classes: {
			base: 'pounce-control',
			input: 'pounce-control-input',
			copy: 'pounce-control-copy',
			label: 'pounce-control-label',
			description: 'pounce-control-description'
		}
	},

	Radio: {
		classes: {
			base: 'pounce-control',
			input: 'pounce-control-input',
			copy: 'pounce-control-copy',
			label: 'pounce-control-label',
			description: 'pounce-control-description'
		}
	},

	Switch: {
		classes: {
			base: 'pounce-control',
			input: 'pounce-control-input',
			copy: 'pounce-control-copy',
			label: 'pounce-control-label',
			description: 'pounce-control-description'
		}
	},

	// ── Dropdowns ────────────────────────────────────────────────────────

	Menu: {
		classes: {
			dropdown: 'dropdown',
			barMobile: 'pounce-menu-bar-mobile',
			barDesktop: 'pounce-menu-bar-desktop'
		}
	},

	Multiselect: {
		classes: {
			base: 'pounce-multiselect',
			menu: 'pounce-multiselect-menu'
		}
	},

	// ── Tokens (Badge / Pill / Chip) ─────────────────────────────────────

	Badge: {
		classes: {
			base: 'pounce-badge',
			label: 'pounce-token-label'
		}
	},

	Pill: {
		classes: {
			base: 'pounce-pill',
			label: 'pounce-token-label'
		}
	},

	Chip: {
		classes: {
			base: 'pounce-chip',
			label: 'pounce-token-label',
			dismiss: 'pounce-chip-dismiss'
		}
	},

	// ── Data Display ─────────────────────────────────────────────────────

	Stars: {
		classes: {
			base: 'pounce-stars',
			item: 'pounce-stars-item'
		}
	},

	// ── Typography ───────────────────────────────────────────────────────

	Heading: {
		classes: {
			base: 'pounce-heading'
		}
	},

	Text: {
		classes: {
			base: 'pounce-text'
		}
	},

	Link: {
		classes: {
			base: 'pounce-link'
		}
	},

	// ── Toolbar ──────────────────────────────────────────────────────────

	Toolbar: {
		classes: {
			root: 'pounce-toolbar',
			spacer: 'pounce-toolbar-spacer',
			spacerVisible: 'pounce-toolbar-spacer-visible'
		}
	},

	// ── Layout ───────────────────────────────────────────────────────

	Layout: {
		classes: {
			base: 'pounce-stack',
			inline: 'pounce-inline',
			grid: 'pounce-grid',
			container: 'container',
			containerFluid: 'container-fluid'
		}
	},

	// ── Overlays ─────────────────────────────────────────────────────────

	Dialog: {
		transitions: {
			enterClass: 'pounce-dialog-enter',
			exitClass: 'pounce-dialog-exit',
			duration: 200
		}
	},

	Toast: {
		transitions: {
			enterClass: 'pounce-toast-enter',
			exitClass: 'pounce-toast-exit',
			duration: 300
		}
	},

	Drawer: {
		transitions: {
			enterClass: 'pounce-drawer-enter',
			exitClass: 'pounce-drawer-exit',
			duration: 300
		}
	}
}

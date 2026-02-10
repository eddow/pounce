import { describe, it, expect } from 'vitest'
import { picoVariants } from './variants'
import { picoAdapter } from './index'
import { picoComponents } from './components'
import { picoTransitions } from './transitions'
import type { Trait } from '@pounce/core'

describe('picoVariants', () => {
	it('defines all standard variants', () => {
		const expected = ['primary', 'secondary', 'contrast', 'outline', 'danger', 'success', 'warning']
		for (const name of expected) {
			expect(picoVariants[name]).toBeDefined()
		}
	})

	it('primary has no classes (Pico default)', () => {
		const primary = picoVariants.primary
		expect(primary.classes).toBeUndefined()
		expect(primary.attributes).toEqual({ 'data-variant': 'primary' })
	})

	it('secondary uses Pico built-in class', () => {
		const secondary = picoVariants.secondary
		expect(secondary.classes).toEqual(['secondary'])
		expect(secondary.attributes).toEqual({ 'data-variant': 'secondary' })
	})

	it('contrast uses Pico built-in class', () => {
		const contrast = picoVariants.contrast
		expect(contrast.classes).toEqual(['contrast'])
		expect(contrast.attributes).toEqual({ 'data-variant': 'contrast' })
	})

	it('outline uses Pico built-in class', () => {
		const outline = picoVariants.outline
		expect(outline.classes).toEqual(['outline'])
		expect(outline.attributes).toEqual({ 'data-variant': 'outline' })
	})

	it('danger uses custom class and a11y attribute', () => {
		const danger = picoVariants.danger
		expect(danger.classes).toEqual(['pounce-pico-danger'])
		expect(danger.attributes).toEqual({
			'data-variant': 'danger',
			'aria-live': 'polite'
		})
	})

	it('success uses custom class', () => {
		const success = picoVariants.success
		expect(success.classes).toEqual(['pounce-pico-success'])
		expect(success.attributes).toEqual({ 'data-variant': 'success' })
	})

	it('warning uses custom class', () => {
		const warning = picoVariants.warning
		expect(warning.classes).toEqual(['pounce-pico-warning'])
		expect(warning.attributes).toEqual({ 'data-variant': 'warning' })
	})

	it('all variants conform to Trait interface', () => {
		for (const [, trait] of Object.entries(picoVariants)) {
			const t = trait as Trait
			// classes must be string[] or Record<string, boolean> or undefined
			if (t.classes !== undefined) {
				expect(Array.isArray(t.classes) || typeof t.classes === 'object').toBe(true)
			}
			// attributes must be Record<string, string | boolean | number> or undefined
			if (t.attributes !== undefined) {
				expect(typeof t.attributes).toBe('object')
			}
			// styles must be Record<string, string | number> or undefined
			if (t.styles !== undefined) {
				expect(typeof t.styles).toBe('object')
			}
		}
	})
})

describe('picoComponents', () => {
	// ── Card ────────────────────────────────────────────────────────

	it('provides Card config with all section classes', () => {
		const card = picoComponents.Card
		expect(card).toBeDefined()
		expect(card!.classes?.base).toBe('pounce-card')
		expect(card!.classes?.header).toBe('pounce-card-header')
		expect(card!.classes?.body).toBe('pounce-card-body')
		expect(card!.classes?.footer).toBe('pounce-card-footer')
	})

	// ── Progress ────────────────────────────────────────────────────

	it('provides Progress config', () => {
		const progress = picoComponents.Progress
		expect(progress).toBeDefined()
		expect(progress!.classes?.base).toBe('pounce-progress')
	})

	// ── Accordion ───────────────────────────────────────────────────

	it('provides Accordion config with all class keys', () => {
		const acc = picoComponents.Accordion
		expect(acc).toBeDefined()
		expect(acc!.classes?.base).toBe('pounce-accordion')
		expect(acc!.classes?.summary).toBe('pounce-accordion-summary')
		expect(acc!.classes?.content).toBe('pounce-accordion-content')
		expect(acc!.classes?.group).toBe('pounce-accordion-group')
	})

	// ── Buttons ──────────────────────────────────────────────────────

	it('provides Button config with classes and iconPlacement', () => {
		const btn = picoComponents.Button
		expect(btn).toBeDefined()
		expect(btn!.classes?.base).toBe('pounce-button')
		expect(btn!.iconPlacement).toBe('start')
	})

	it('provides CheckButton config with all class keys', () => {
		const cb = picoComponents.CheckButton
		expect(cb).toBeDefined()
		expect(cb!.classes?.base).toBe('pounce-checkbutton')
		expect(cb!.classes?.checked).toBe('pounce-checkbutton-checked')
		expect(cb!.classes?.icon).toBe('pounce-checkbutton-icon')
		expect(cb!.classes?.label).toBe('pounce-checkbutton-label')
		expect(cb!.iconPlacement).toBe('start')
	})

	it('provides RadioButton config', () => {
		const rb = picoComponents.RadioButton
		expect(rb).toBeDefined()
		expect(rb!.classes?.base).toBe('pounce-radiobutton')
		expect(rb!.classes?.checked).toBe('pounce-radiobutton-checked')
	})

	it('provides ButtonGroup config with orientation classes', () => {
		const bg = picoComponents.ButtonGroup
		expect(bg).toBeDefined()
		expect(bg!.classes?.base).toBe('pounce-buttongroup')
		expect(bg!.classes?.horizontal).toBe('pounce-buttongroup-horizontal')
		expect(bg!.classes?.vertical).toBe('pounce-buttongroup-vertical')
	})

	// ── Forms ────────────────────────────────────────────────────────

	it('provides Select config', () => {
		const sel = picoComponents.Select
		expect(sel).toBeDefined()
		expect(sel!.classes?.base).toBe('pounce-select')
		expect(sel!.classes?.full).toBe('pounce-select-full')
	})

	it('provides Combobox config', () => {
		const cb = picoComponents.Combobox
		expect(cb).toBeDefined()
		expect(cb!.classes?.base).toBe('pounce-combobox')
	})

	it('provides Checkbox config with control classes', () => {
		const chk = picoComponents.Checkbox
		expect(chk).toBeDefined()
		expect(chk!.classes?.base).toBe('pounce-control')
		expect(chk!.classes?.input).toBe('pounce-control-input')
		expect(chk!.classes?.label).toBe('pounce-control-label')
		expect(chk!.classes?.description).toBe('pounce-control-description')
	})

	it('provides Radio config with control classes', () => {
		const rad = picoComponents.Radio
		expect(rad).toBeDefined()
		expect(rad!.classes?.base).toBe('pounce-control')
		expect(rad!.classes?.input).toBe('pounce-control-input')
	})

	it('provides Switch config with control classes', () => {
		const sw = picoComponents.Switch
		expect(sw).toBeDefined()
		expect(sw!.classes?.base).toBe('pounce-control')
		expect(sw!.classes?.input).toBe('pounce-control-input')
	})

	// ── Dropdowns ────────────────────────────────────────────────────

	it('provides Menu config with Pico dropdown class', () => {
		const menu = picoComponents.Menu
		expect(menu).toBeDefined()
		expect(menu!.classes?.dropdown).toBe('dropdown')
	})

	it('provides Multiselect config', () => {
		const ms = picoComponents.Multiselect
		expect(ms).toBeDefined()
		expect(ms!.classes?.base).toBe('pounce-multiselect')
		expect(ms!.classes?.menu).toBe('pounce-multiselect-menu')
	})

	// ── Tokens ───────────────────────────────────────────────────────

	it('provides Badge config', () => {
		const badge = picoComponents.Badge
		expect(badge).toBeDefined()
		expect(badge!.classes?.base).toBe('pounce-badge')
		expect(badge!.classes?.label).toBe('pounce-token-label')
	})

	it('provides Pill config', () => {
		const pill = picoComponents.Pill
		expect(pill).toBeDefined()
		expect(pill!.classes?.base).toBe('pounce-pill')
		expect(pill!.classes?.label).toBe('pounce-token-label')
	})

	it('provides Chip config with dismiss class', () => {
		const chip = picoComponents.Chip
		expect(chip).toBeDefined()
		expect(chip!.classes?.base).toBe('pounce-chip')
		expect(chip!.classes?.dismiss).toBe('pounce-chip-dismiss')
	})

	// ── Data Display ─────────────────────────────────────────────────

	it('provides Stars config', () => {
		const stars = picoComponents.Stars
		expect(stars).toBeDefined()
		expect(stars!.classes?.base).toBe('pounce-stars')
		expect(stars!.classes?.item).toBe('pounce-stars-item')
	})

	// ── Typography ───────────────────────────────────────────────────

	it('provides Heading config', () => {
		expect(picoComponents.Heading!.classes?.base).toBe('pounce-heading')
	})

	it('provides Text config', () => {
		expect(picoComponents.Text!.classes?.base).toBe('pounce-text')
	})

	it('provides Link config', () => {
		expect(picoComponents.Link!.classes?.base).toBe('pounce-link')
	})

	// ── Layout ───────────────────────────────────────────────────────

	it('provides Layout config with all sub-component classes', () => {
		const layout = picoComponents.Layout
		expect(layout).toBeDefined()
		expect(layout!.classes?.base).toBe('pounce-stack')
		expect(layout!.classes?.inline).toBe('pounce-inline')
		expect(layout!.classes?.grid).toBe('pounce-grid')
		expect(layout!.classes?.container).toBe('container')
		expect(layout!.classes?.containerFluid).toBe('container-fluid')
	})

	// ── Toolbar ──────────────────────────────────────────────────────

	it('provides Toolbar config', () => {
		const toolbar = picoComponents.Toolbar
		expect(toolbar).toBeDefined()
		expect(toolbar!.classes?.root).toBe('pounce-toolbar')
	})

	// ── Overlays ─────────────────────────────────────────────────────

	it('provides Dialog transition config', () => {
		const dialog = picoComponents.Dialog
		expect(dialog).toBeDefined()
		expect(dialog!.transitions?.duration).toBe(200)
	})

	it('provides Toast transition config', () => {
		const toast = picoComponents.Toast
		expect(toast).toBeDefined()
		expect(toast!.transitions?.duration).toBe(300)
	})

	it('provides Drawer transition config', () => {
		const drawer = picoComponents.Drawer
		expect(drawer).toBeDefined()
		expect(drawer!.transitions?.duration).toBe(300)
	})

	// ── Coverage check ───────────────────────────────────────────────

	it('covers all expected component keys', () => {
		const expected = [
			'Card', 'Progress', 'Accordion',
			'Button', 'CheckButton', 'RadioButton', 'ButtonGroup',
			'Select', 'Combobox', 'Checkbox', 'Radio', 'Switch',
			'Menu', 'Multiselect',
			'Badge', 'Pill', 'Chip',
			'Stars',
			'Heading', 'Text', 'Link',
			'Toolbar', 'Layout',
			'Dialog', 'Toast', 'Drawer'
		]
		for (const key of expected) {
			expect(picoComponents[key as keyof typeof picoComponents], `missing: ${key}`).toBeDefined()
		}
		expect(Object.keys(picoComponents)).toHaveLength(expected.length)
	})
})

describe('picoTransitions', () => {
	it('has 200ms default duration', () => {
		expect(picoTransitions.duration).toBe(200)
	})

	it('defines enter/exit/active classes', () => {
		expect(picoTransitions.enterClass).toBe('pounce-pico-enter')
		expect(picoTransitions.exitClass).toBe('pounce-pico-exit')
		expect(picoTransitions.activeClass).toBe('pounce-pico-active')
	})
})

describe('picoAdapter', () => {
	it('is a valid Partial<FrameworkAdapter>', () => {
		expect(picoAdapter.variants).toBe(picoVariants)
		expect(picoAdapter.transitions).toBe(picoTransitions)
		expect(picoAdapter.components).toBe(picoComponents)
	})

	it('does not provide iconFactory (separate concern)', () => {
		expect(picoAdapter.iconFactory).toBeUndefined()
	})
})

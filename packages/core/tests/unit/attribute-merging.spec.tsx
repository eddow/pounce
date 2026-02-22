import { h, rootEnv, c, r } from '@pounce/core'
import { reactive } from 'mutts'
import { describe, expect, it } from 'vitest'

describe('Attribute Merging (Class & Style)', () => {
	it('merges string classes from multiple layers', () => {
		const props = c({ class: 'inner' }, { class: 'extra' })
		const mount = h('div', { class: 'base' }, h('span', props))
		const root = mount.render(rootEnv)[0] as HTMLElement
		const span = root.querySelector('span')
		expect(span?.className).toBe('inner extra')
	})

	it('merges array and object classes', () => {
		const classes = { active: true, hidden: false }
		const props = c({ class: ['btn', 'large'] }, { class: 'base' }, { class: classes })
		const mount = h('div', {}, h('button', props))
		const root = mount.render(rootEnv)[0] as HTMLElement
		const button = root.querySelector('button')
		expect(button?.className).toBe('btn large base active')
	})

	it('merges styles from multiple layers', () => {
		const props = c({ style: { fontWeight: 'bold' } }, { style: 'font-size: 12px;' })
		const mount = h('div', { style: 'color: red;' }, h('span', props))
		const root = mount.render(rootEnv)[0] as HTMLElement
		const span = root.querySelector('span') as HTMLElement
		expect(span.style.color).toBe('') // color was on parent
		expect(span.style.fontWeight).toBe('bold')
		expect(span.style.fontSize).toBe('12px')
	})

	it('later styles override earlier ones for the same property', () => {
		const props = c(
			{ style: { color: 'red', padding: '10px' } },
			{ style: 'color: blue;' },
			{ style: { padding: '20px' } }
		)
		const mount = h('div', props)
		const node = mount.render(rootEnv)[0] as HTMLElement
		expect(node.style.color).toBe('blue')
		expect(node.style.padding).toBe('20px')
	})

	it('reactive classes update correctly when merged', () => {
		const state = reactive({ isActive: false })
		const props = c(
			{ class: 'static' },
			{ class: r(() => (state.isActive ? 'active' : '')) }
		)
		const mount = h('div', {}, h('span', props))
		const root = mount.render(rootEnv)[0] as HTMLElement
		const span = root.querySelector('span')

		expect(span?.className).toBe('static')

		state.isActive = true
		expect(span?.className).toBe('static active')
	})

	it('standard attributes do NOT merge (last one wins)', () => {
		const props = c({ id: 'inner' }, { id: 'override' }, { title: 'B' })
		const mount = h('div', { id: 'first', title: 'A' }, h('span', props))
		const root = mount.render(rootEnv)[0] as HTMLElement
		const span = root.querySelector('span')
		expect(span?.id).toBe('override')
		expect(span?.title).toBe('B')
	})
})

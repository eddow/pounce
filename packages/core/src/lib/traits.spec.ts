import { describe, expect, it } from 'vitest'
import { h, rootScope } from '.'
import { classNames, styles } from './styles'
import { buildTraitChain, type Trait } from './traits'

describe('buildTraitChain', () => {
	it('should accumulate classes from a single trait', () => {
		const trait: Trait = { classes: ['new-class'] }
		const { classes, chain } = buildTraitChain(trait)

		expect(classes).toEqual(['new-class'])
		expect(chain).toBeNull()
	})

	it('should accumulate conditional classes', () => {
		const trait: Trait = {
			classes: {
				class1: true,
				class2: false,
				class3: true as any,
				class4: false as any,
			},
		}

		const { classes } = buildTraitChain(trait)

		expect(classes).toEqual([{ class1: true, class2: false, class3: true, class4: false }])
	})

	it('should build chain for attributes and accumulate styles', () => {
		const trait: Trait = {
			styles: { color: 'red', fontSize: '14px' },
			attributes: { 'aria-label': 'Test', role: 'button' },
		}

		const { chain, styles: traitStyles } = buildTraitChain(trait)

		expect(traitStyles).toEqual([{ color: 'red', fontSize: '14px' }])
		expect(chain).not.toBeNull()
		expect(chain!['aria-label']).toBe('Test')
		expect(chain!.role).toBe('button')
	})

	it('should merge multiple traits', () => {
		const trait1: Trait = {
			classes: ['class1'],
			styles: { color: 'blue' },
			attributes: { 'data-test': '1' },
		}
		const trait2: Trait = {
			classes: ['class2'],
			styles: { backgroundColor: 'blue' },
			attributes: { 'data-test': '2' },
		}

		const { chain, classes, styles: traitStyles } = buildTraitChain([trait1, trait2])

		expect(classes).toEqual(['class1', 'class2'])
		expect(traitStyles).toEqual([{ color: 'blue' }, { backgroundColor: 'blue' }])
		// Later trait's attributes shadow earlier ones via prototype chain
		expect(chain!['data-test']).toBe('2')
	})

	it('should handle later traits overriding earlier attribute values', () => {
		const trait1: Trait = {
			classes: ['old'],
			styles: { color: 'red' },
			attributes: { role: 'old' },
		}
		const trait2: Trait = {
			classes: { old: false, new: true },
			styles: { color: 'blue' },
			attributes: { role: 'new' },
		}

		const { chain, classes, styles: traitStyles } = buildTraitChain([trait1, trait2])

		expect(classNames(classes)).toEqual('new')
		expect(styles(traitStyles)).toEqual({ color: 'blue' })
		expect(chain!.role).toBe('new')
	})

	it('should handle empty and null traits', () => {
		const { chain, classes, styles: traitStyles } = buildTraitChain([
			null as any,
			undefined as any,
			{},
			{ classes: [] },
		])

		expect(chain).toBeNull()
		expect(classes).toEqual([])
		expect(traitStyles).toEqual([])
	})

	it('should handle mixed array and object classes', () => {
		const trait1: Trait = { classes: ['btn'] }
		const trait2: Trait = { classes: { 'btn-primary': true, 'btn-secondary': false } }

		const { classes } = buildTraitChain([trait1, trait2])

		expect(classes).toEqual(['btn', { 'btn-primary': true, 'btn-secondary': false }])
	})

	it('should make trait attributes read-only', () => {
		const trait: Trait = { attributes: { role: 'button' } }
		const { chain } = buildTraitChain(trait)

		expect(chain!.role).toBe('button')
		// Setter exists but warns/throws — does not change the value
		chain!.role = 'link'
		expect(chain!.role).toBe('button')
	})
})

describe('Traits in JSX', () => {
	it('should apply trait classes to elements', () => {
		const trait: Trait = {
			classes: ['test-class', 'another-class'],
		}

		const element = h('button', { traits: trait }, 'Test')
		const root = element.render(rootScope)
		const button = Array.isArray(root) ? root[0] : (root as HTMLButtonElement)

		expect(button).toBeTruthy()
		expect(button.classList.contains('test-class')).toBe(true)
		expect(button.classList.contains('another-class')).toBe(true)
	})

	it('should apply trait styles to elements', () => {
		const trait: Trait = {
			styles: {
				backgroundColor: 'red',
				fontSize: '16px',
			},
		}

		const element = h('div', { traits: trait }, 'Styled')
		const root = element.render(rootScope)
		const div = Array.isArray(root) ? root[0] : (root as HTMLDivElement)

		expect(div).toBeTruthy()
		expect(div.style.backgroundColor).toBe('red')
		expect(div.style.fontSize).toBe('16px')
	})

	it('should apply trait attributes to elements', () => {
		const trait: Trait = {
			attributes: {
				'aria-label': 'Test button',
				'data-test': 'value',
				role: 'button',
			},
		}

		const element = h('span', { traits: trait }, 'Content')
		const root = element.render(rootScope)
		const span = Array.isArray(root) ? root[0] : (root as HTMLSpanElement)

		expect(span).toBeTruthy()
		expect(span.getAttribute('aria-label')).toBe('Test button')
		expect(span.getAttribute('data-test')).toBe('value')
		expect(span.getAttribute('role')).toBe('button')
	})

	it('should merge multiple traits', () => {
		const trait1: Trait = {
			classes: ['base'],
			styles: { color: 'white' },
			attributes: { role: 'button' },
		}

		const trait2: Trait = {
			classes: ['primary'],
			styles: { backgroundColor: 'blue' },
			attributes: { 'aria-label': 'Primary button' },
		}

		const element = h('button', { traits: [trait1, trait2] }, 'Button')
		const root = element.render(rootScope)
		const button = Array.isArray(root) ? root[0] : (root as HTMLButtonElement)

		expect(button).toBeTruthy()
		expect(button.classList.contains('base')).toBe(true)
		expect(button.classList.contains('primary')).toBe(true)
		expect(button.style.color).toBe('white')
		expect(button.style.backgroundColor).toBe('blue')
		expect(button.getAttribute('role')).toBe('button')
		expect(button.getAttribute('aria-label')).toBe('Primary button')
	})

	it('should not pass traits as DOM attribute', () => {
		const trait: Trait = {
			classes: ['test'],
		}

		const element = h('div', { traits: trait, 'data-attr': 'value' }, 'Test')
		const root = element.render(rootScope)
		const div = Array.isArray(root) ? root[0] : (root as HTMLDivElement)

		expect(div).toBeTruthy()
		expect(div.hasAttribute('traits')).toBe(false)
		expect(div.getAttribute('data-attr')).toBe('value')
	})
})

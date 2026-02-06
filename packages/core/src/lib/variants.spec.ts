import { describe, expect, it } from 'vitest'
import { h, rootScope } from '.'
import { classNames, styles } from './styles'
import { applyVariants, type Variant } from './variants'

describe('applyVariants', () => {
	it('should apply a single variant with classes', () => {
		const props = { class: 'existing' }
		const variant: Variant = { classes: ['new-class'] }

		const result = applyVariants(props, variant)

		expect(result.class).toEqual(['existing', 'new-class'])
	})

	it('should apply a single variant with conditional classes', () => {
		const props = {}
		const variant: Variant = {
			classes: {
				class1: true,
				class2: false,
				class3: true as any, // truthy
				class4: false as any, // falsy
			},
		}

		const result = applyVariants(props, variant)

		expect(result.class).toEqual([{ class1: true, class2: false, class3: true, class4: false }])
	})

	it('should apply a single variant with styles and attributes', () => {
		const props = {}
		const variant: Variant = {
			styles: { color: 'red', fontSize: '14px' },
			attributes: { 'aria-label': 'Test', role: 'button' },
		}

		const result = applyVariants(props, variant) as any

		expect(result.style).toEqual([{ color: 'red', fontSize: '14px' }])
		expect(result['aria-label']).toBe('Test')
		expect(result.role).toBe('button')
	})

	it('should merge multiple variants', () => {
		const props = { class: 'base' }
		const variant1: Variant = {
			classes: ['class1'],
			styles: { color: 'blue' },
			attributes: { 'data-test': '1' },
		}
		const variant2: Variant = {
			classes: ['class2'],
			styles: { backgroundColor: 'blue' },
			attributes: { 'data-test': '2' },
		}

		const result = applyVariants(props, [variant1, variant2]) as any

		expect(result.class).toEqual(['base', 'class1', 'class2'])
		expect(result.style).toEqual([{ color: 'blue' }, { backgroundColor: 'blue' }])
		expect(result['data-test']).toBe('2') // Later variant overrides
	})

	it('should handle later variants overriding earlier ones', () => {
		const props = {}
		const variant1: Variant = {
			classes: ['old'],
			styles: { color: 'red' },
			attributes: { role: 'old' },
		}
		const variant2: Variant = {
			classes: { old: false, new: true },
			styles: { color: 'blue' },
			attributes: { role: 'new' },
		}

		const result = applyVariants(props, [variant1, variant2]) as any

		// Note: With conditional objects, false values are filtered out
		expect(classNames(result.class)).toEqual('new')
		expect(styles(result.style)).toEqual({ color: 'blue' })
		expect(result.role).toBe('new')
	})

	it('should handle empty and null variants', () => {
		const props = { class: 'test' }
		const result = applyVariants(props, [null as any, undefined as any, {}, { classes: [] }]) as any

		expect(result.class).toEqual(['test'])
		expect(result.style).toEqual([])
		// Attributes are applied directly to the result object, not stored in .attributes
		expect(
			Object.keys(result).filter(
				(key) => key.startsWith('data-') || key === 'role' || key === 'aria-label'
			)
		).toHaveLength(0)
	})

	it('should handle mixed array and object classes', () => {
		const variant1: Variant = {
			classes: ['btn'],
		}
		const variant2: Variant = {
			classes: { 'btn-primary': true, 'btn-secondary': false },
		}

		const result = applyVariants({}, [variant1, variant2])

		expect(result.class).toEqual(['btn', { 'btn-primary': true, 'btn-secondary': false }])
	})

	it('should remove classes when condition is false', () => {
		const props = { class: 'class1 class2 class3' }
		const variant: Variant = {
			classes: { class2: false, class4: true },
		}

		const result = applyVariants(props, variant)

		// class2 is filtered out from the conditional object
		// class4 is added
		expect(result.class).toEqual(['class1', 'class2', 'class3', { class2: false, class4: true }])
	})
})

describe('Variants in JSX', () => {
	it('should apply variant classes to elements', () => {
		const variant: Variant = {
			classes: ['test-class', 'another-class'],
		}

		const element = h('button', { variants: variant }, 'Test')
		const root = element.render(rootScope)
		const button = Array.isArray(root) ? root[0] : (root as HTMLButtonElement)

		expect(button).toBeTruthy()
		expect(button.classList.contains('test-class')).toBe(true)
		expect(button.classList.contains('another-class')).toBe(true)
	})

	it('should apply variant styles to elements', () => {
		const variant: Variant = {
			styles: {
				backgroundColor: 'red',
				fontSize: '16px',
			},
		}

		const element = h('div', { variants: variant }, 'Styled')
		const root = element.render(rootScope)
		const div = Array.isArray(root) ? root[0] : (root as HTMLDivElement)

		expect(div).toBeTruthy()
		expect(div.style.backgroundColor).toBe('red')
		expect(div.style.fontSize).toBe('16px')
	})

	it('should apply variant attributes to elements', () => {
		const variant: Variant = {
			attributes: {
				'aria-label': 'Test button',
				'data-test': 'value',
				role: 'button',
			},
		}

		const element = h('span', { variants: variant }, 'Content')
		const root = element.render(rootScope)
		const span = Array.isArray(root) ? root[0] : (root as HTMLSpanElement)

		expect(span).toBeTruthy()
		expect(span.getAttribute('aria-label')).toBe('Test button')
		expect(span.getAttribute('data-test')).toBe('value')
		expect(span.getAttribute('role')).toBe('button')
	})

	it('should merge multiple variants', () => {
		const variant1: Variant = {
			classes: ['base'],
			styles: { color: 'white' },
			attributes: { role: 'button' },
		}

		const variant2: Variant = {
			classes: ['primary'],
			styles: { backgroundColor: 'blue' },
			attributes: { 'aria-label': 'Primary button' },
		}

		const element = h('button', { variants: [variant1, variant2] }, 'Button')
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

	it('should not pass variants as DOM attribute', () => {
		const variant: Variant = {
			classes: ['test'],
		}

		const element = h('div', { variants: variant, 'data-attr': 'value' }, 'Test')
		const root = element.render(rootScope)
		const div = Array.isArray(root) ? root[0] : (root as HTMLDivElement)

		expect(div).toBeTruthy()
		expect(div.hasAttribute('variants')).toBe(false)
		expect(div.getAttribute('data-attr')).toBe('value')
	})
})

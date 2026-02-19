/// <reference path="../../node_modules/@pounce/core/src/types/jsx.d.ts" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { Heading, Text, Link } from '../../src/components/typography'
import { installTestAdapter, resetAdapter } from '../test-adapter'

describe('Heading', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		document.body.innerHTML = ''
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = latch(container, element)
	}

	it('renders with default level 2', () => {
		render(<Heading>Default Heading</Heading>)
		const heading = container.querySelector('.pounce-heading')
		expect(heading).toBeTruthy()
		expect(heading?.tagName).toBe('H2')
		expect(heading?.classList.contains('pounce-heading-level-2')).toBe(true)
	})

	it('renders all heading levels correctly', () => {
		const levels = [1, 2, 3, 4, 5, 6] as const
		
		levels.forEach(level => {
			container.innerHTML = ''
			render(<Heading level={level}>Level {level}</Heading>)
			
			const heading = container.querySelector('.pounce-heading')
			expect(heading?.tagName).toBe(`H${level}`)
			expect(heading?.classList.contains(`pounce-heading-level-${level}`)).toBe(true)
		})
	})

	it('applies custom tag while maintaining level styling', () => {
		render(<Heading level={1} tag="div">Div Heading</Heading>)
		const heading = container.querySelector('.pounce-heading')
		expect(heading?.tagName).toBe('DIV')
		expect(heading?.classList.contains('pounce-heading-level-1')).toBe(true)
	})

	it('applies variant classes', () => {
		const variants = ['primary', 'secondary', 'contrast', 'success', 'warning', 'danger']
		
		variants.forEach(variant => {
			container.innerHTML = ''
			render(<Heading variant={variant as any}>{variant}</Heading>)
			
			const heading = container.querySelector('.pounce-heading')
			expect(heading?.classList.contains(`pounce-heading-variant-${variant}`)).toBe(true)
		})
	})

	it('applies alignment classes', () => {
		const alignments = ['start', 'center', 'end'] as const
		
		alignments.forEach(align => {
			container.innerHTML = ''
			render(<Heading align={align}>Aligned {align}</Heading>)
			
			const heading = container.querySelector('.pounce-heading')
			if (align !== 'start') {
				expect(heading?.classList.contains(`pounce-heading-align-${align}`)).toBe(true)
			}
		})
	})

	it('applies custom classes via el prop', () => {
		render(<Heading el={{ class: 'custom-heading' }}>Custom</Heading>)
		const heading = container.querySelector('.pounce-heading')
		expect(heading?.classList.contains('custom-heading')).toBe(true)
	})

	it('clamps level to valid range (1-6)', () => {
		render(<Heading level={10 as any}>Clamped</Heading>)
		const heading = container.querySelector('.pounce-heading')
		expect(heading?.classList.contains('pounce-heading-level-6')).toBe(true)
	})

	it('uses adapter class override', () => {
		installTestAdapter()
		render(<Heading>Adapted</Heading>)
		const heading = container.querySelector('.test-heading')
		expect(heading).toBeTruthy()
		expect(heading?.tagName).toBe('H2')
	})

	it('applies variant from adapter', () => {
		installTestAdapter()
		render(<Heading variant="success">Success</Heading>)
		const heading = container.querySelector('.test-heading')
		expect(heading).toBeTruthy()
		expect(heading?.getAttribute('data-variant')).toBe('success')
		expect(heading?.classList.contains('test-success')).toBe(true)
	})

	it('uses fallback variant class when no adapter', () => {
		render(<Heading variant="danger">Danger</Heading>)
		const heading = container.querySelector('.pounce-heading')
		expect(heading?.classList.contains('pounce-heading-variant-danger')).toBe(true)
	})
})

describe('Text', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		document.body.innerHTML = ''
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = latch(container, element)
	}

	it('renders with default props', () => {
		render(<Text>Default text</Text>)
		const text = container.querySelector('.pounce-text')
		expect(text).toBeTruthy()
		expect(text?.tagName).toBe('P')
		expect(text?.classList.contains('pounce-text-md')).toBe(true)
	})

	it('applies size classes', () => {
		const sizes = ['sm', 'md', 'lg'] as const
		
		sizes.forEach(size => {
			container.innerHTML = ''
			render(<Text size={size}>Size {size}</Text>)
			
			const text = container.querySelector('.pounce-text')
			expect(text?.classList.contains(`pounce-text-${size}`)).toBe(true)
		})
	})

	it('applies muted class', () => {
		render(<Text muted>Muted text</Text>)
		const text = container.querySelector('.pounce-text')
		expect(text?.classList.contains('pounce-text-muted')).toBe(true)
	})

	it('applies variant classes', () => {
		const variants = ['primary', 'secondary', 'contrast', 'success', 'warning', 'danger']
		
		variants.forEach(variant => {
			container.innerHTML = ''
			render(<Text variant={variant as any}>{variant}</Text>)
			
			const text = container.querySelector('.pounce-text')
			expect(text?.classList.contains(`pounce-text-variant-${variant}`)).toBe(true)
		})
	})

	it('supports custom tag', () => {
		render(<Text tag="span">Span text</Text>)
		const text = container.querySelector('.pounce-text')
		expect(text?.tagName).toBe('SPAN')
	})

	it('applies custom classes via el prop', () => {
		render(<Text el={{ class: 'custom-text' }}>Custom</Text>)
		const text = container.querySelector('.pounce-text')
		expect(text?.classList.contains('custom-text')).toBe(true)
	})

	it('uses adapter class override', () => {
		installTestAdapter()
		render(<Text>Adapted</Text>)
		const text = container.querySelector('.test-text')
		expect(text).toBeTruthy()
	})

	it('applies variant from adapter', () => {
		installTestAdapter()
		render(<Text variant="danger">Error</Text>)
		const text = container.querySelector('.test-text')
		expect(text?.getAttribute('data-variant')).toBe('danger')
		expect(text?.classList.contains('test-danger')).toBe(true)
	})
})

describe('Link', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		document.body.innerHTML = ''
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = latch(container, element)
	}

	it('renders with default props', () => {
		render(<Link href="/test">Link text</Link>)
		const link = container.querySelector('.pounce-link')
		expect(link).toBeTruthy()
		expect(link?.tagName).toBe('A')
		expect((link as HTMLAnchorElement)?.href).toContain('/test')
	})

	it('applies underline by default', () => {
		render(<Link href="/test">Underlined</Link>)
		const link = container.querySelector('.pounce-link')
		expect(link?.classList.contains('pounce-link-no-underline')).toBe(false)
	})

	it('removes underline when underline=false', () => {
		render(<Link href="/test" underline={false}>No underline</Link>)
		const link = container.querySelector('.pounce-link')
		expect(link?.classList.contains('pounce-link-no-underline')).toBe(true)
	})

	it('applies variant classes', () => {
		const variants = ['primary', 'secondary', 'contrast', 'success', 'warning', 'danger']
		
		variants.forEach(variant => {
			container.innerHTML = ''
			render(<Link href="/test" variant={variant as any}>{variant}</Link>)
			
			const link = container.querySelector('.pounce-link')
			expect(link?.classList.contains(`pounce-link-variant-${variant}`)).toBe(true)
		})
	})

	it('supports standard anchor attributes', () => {
		render(<Link href="/test" target="_blank" rel="noopener">External</Link>)
		const link = container.querySelector('.pounce-link') as HTMLAnchorElement
		expect(link?.target).toBe('_blank')
		expect(link?.rel).toBe('noopener')
	})

	it('applies custom classes', () => {
		render(<Link href="/test" class="custom-link">Custom</Link>)
		const link = container.querySelector('.pounce-link')
		expect(link?.classList.contains('custom-link')).toBe(true)
	})

	it('uses adapter class override', () => {
		installTestAdapter()
		render(<Link href="/test">Adapted</Link>)
		const link = container.querySelector('.test-link')
		expect(link).toBeTruthy()
	})

	it('applies variant from adapter', () => {
		installTestAdapter()
		render(<Link href="/test" variant="warning">Warning</Link>)
		const link = container.querySelector('.test-link')
		expect(link?.getAttribute('data-variant')).toBe('warning')
		expect(link?.classList.contains('test-warning')).toBe(true)
	})
})

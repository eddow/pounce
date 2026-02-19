import { document, latch } from '@pounce/core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetAdapter, setAdapter } from '../adapter/registry'
import { vanillaAdapter } from '../adapter/vanilla'
import { Button } from './button'

describe('Button', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		setAdapter(vanillaAdapter)
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = latch(container, element)
	}

	// Basic Rendering Tests (inspired by Pico's basic rendering tests)
	it('renders with default props', () => {
		render(<Button>Click me</Button>)
		const button = container.querySelector('.pounce-button')
		expect(button).toBeTruthy()
		expect(button?.textContent).toContain('Click me')
		expect(button?.tagName).toBe('BUTTON')
	})

	// Variant Tests (inspired by Pico's comprehensive variant testing)
	it('applies all standard variant classes via dynamic flavoring', () => {
		const variants = ['primary', 'secondary', 'contrast', 'danger', 'success', 'warning']

		variants.forEach(variant => {
			// Clear previous renders
			container.innerHTML = ''

			// Test dynamic flavoring
			const ButtonVariant = Button[variant]
			render(<ButtonVariant>{variant.charAt(0).toUpperCase() + variant.slice(1)}</ButtonVariant>)

			const button = container.querySelector('.pounce-button')
			expect(button?.classList.contains(`pounce-variant-${variant}`)).toBe(true)
		})
	})

	it('applies variant classes via explicit variant prop', () => {
		render(<Button variant="danger">Danger</Button>)
		const button = container.querySelector('.pounce-button')
		expect(button?.classList.contains('pounce-variant-danger')).toBe(true)
	})

	// Icon Tests (inspired by Pico's icon testing)
	it('handles icon-only mode with proper accessibility', () => {
		render(<Button icon="star" ariaLabel="Star Action" />)
		const button = container.querySelector('.pounce-button')
		expect(button?.classList.contains('pounce-button-icon-only')).toBe(true)
		expect(button?.getAttribute('aria-label')).toBe('Star Action')
	})

	it('provides default aria-label for icon-only buttons', () => {
		render(<Button icon="star" />)
		const button = container.querySelector('.pounce-button')
		expect(button?.getAttribute('aria-label')).toBe('Action')
	})

	// Adapter Tests (inspired by Pico's framework integration)
	it('respects adapter overrides for base and variant classes', () => {
		setAdapter({
			variants: {
				primary: { classes: ['btn-primary'], attributes: { 'data-variant': 'primary' } },
			},
			components: {
				Button: {
					classes: {
						base: 'custom-btn',
						iconOnly: 'btn-icon-only'
					}
				}
			}
		})

		// Test base class override
		render(<Button>Custom</Button>)
		const button = container.querySelector('.custom-btn')
		expect(button).toBeTruthy()
		expect(button?.classList.contains('pounce-button')).toBe(false)

		// Test variant class override (variants come from adapter.variants, not component classes)
		container.innerHTML = ''
		render(<Button.primary>Primary</Button.primary>)
		const primaryButton = container.querySelector('.custom-btn')
		expect(primaryButton?.classList.contains('btn-primary')).toBe(true)
		expect(primaryButton?.classList.contains('pounce-variant-primary')).toBe(false)
	})

	// State Tests (inspired by Pico's interaction testing)
	it('handles disabled state correctly', () => {
		render(<Button disabled>Disabled</Button>)
		const button = container.querySelector('.pounce-button') as HTMLButtonElement
		expect(button?.disabled).toBe(true)
		expect(button?.getAttribute('disabled')).toBe('')
	})

	// Event Handler Tests (inspired by Pico's event testing)
	it('calls onClick handler when clicked', () => {
		let clicked = false

		const handleClick = () => {
			clicked = true
		}

		render(<Button onClick={handleClick}>Click me</Button>)
		const button = container.querySelector('.pounce-button') as HTMLButtonElement
		button.click()

		expect(clicked).toBe(true)
	})

	// Accessibility Tests (inspired by Pico's comprehensive accessibility testing)
	it('icon-only buttons have proper accessibility attributes', () => {
		render(<Button icon="star" ariaLabel="Star Icon" />)
		const button = container.querySelector('.pounce-button')

		expect(button?.getAttribute('aria-label')).toBe('Star Icon')
		// Native button elements don't need explicit role or tabindex
		expect(button?.tagName).toBe('BUTTON')
	})

	it('buttons are keyboard focusable', () => {
		render(<Button>Focusable</Button>)
		const button = container.querySelector('.pounce-button') as HTMLButtonElement

		button.focus()
		expect(document.activeElement).toBe(button)
	})

	// HTML Element Tests (inspired by Pico's tag flexibility)
	it('supports different HTML tags', () => {
		render(<Button tag="a" el={{ href: '/test', target: '_blank' }}>Link Button</Button>)
		const button = container.querySelector('.pounce-button')
		expect(button?.tagName).toBe('A')
		expect((button as HTMLAnchorElement)?.href).toContain('/test')
		expect((button as HTMLAnchorElement)?.target).toBe('_blank')
	})

	it('supports div tag for custom button-like elements', () => {
		render(<Button tag="div" el={{ role: 'button', tabIndex: 0 }}>Div Button</Button>)
		const button = container.querySelector('.pounce-button')
		expect(button?.tagName).toBe('DIV')
		expect(button?.getAttribute('role')).toBe('button')
		expect(button?.getAttribute('tabindex')).toBe('0')
	})

	// Custom Attributes Tests (inspired by Pico's flexibility)
	it('applies custom aria-label', () => {
		render(<Button ariaLabel="Custom Action">Button</Button>)
		const button = container.querySelector('.pounce-button')
		expect(button?.getAttribute('aria-label')).toBe('Custom Action')
	})

	it('applies custom classes via el prop', () => {
		render(<Button el={{ class: 'custom-class extra-class' }}>Button</Button>)
		const button = container.querySelector('.pounce-button')
		expect(button?.classList.contains('custom-class')).toBe(true)
		expect(button?.classList.contains('extra-class')).toBe(true)
	})

	it('applies custom data attributes', () => {
		render(<Button el={{ 'data-testid': 'test-button', 'data-action': 'submit' }}>Button</Button>)
		const button = container.querySelector('.pounce-button')
		expect(button?.getAttribute('data-testid')).toBe('test-button')
		expect(button?.getAttribute('data-action')).toBe('submit')
	})

	// Edge Cases and Error Handling (inspired by Pico's robustness testing)
	it('handles empty children gracefully', () => {
		render(<Button></Button>)
		const button = container.querySelector('.pounce-button')
		expect(button).toBeTruthy()
		expect(button?.textContent).toBe('')
	})

	it('handles null children gracefully', () => {
		render(<Button>{null}</Button>)
		const button = container.querySelector('.pounce-button')
		expect(button).toBeTruthy()
		expect(button?.textContent).toBe('')
	})

	it('handles complex children (nested elements)', () => {
		render(<Button><span>Nested <strong>Text</strong></span></Button>)
		const button = container.querySelector('.pounce-button')
		expect(button).toBeTruthy()
		expect(button?.querySelector('span')).toBeTruthy()
		expect(button?.querySelector('strong')).toBeTruthy()
	})
})

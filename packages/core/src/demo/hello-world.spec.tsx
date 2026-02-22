import { describe, expect, it } from 'vitest'
import { h, rootEnv } from '../lib'
import { HelloWorld } from './hello-world'

describe('HelloWorld Component', () => {
	it('renders with default props', () => {
		const mount = h(HelloWorld, {})
		const rootElement = mount.render(rootEnv)[0] as HTMLElement

		const greetingElement = rootElement.querySelector('.greeting')
		const messageElement = rootElement.querySelector('.message')

		expect(greetingElement?.textContent).toBe('Hello, World!')
		expect(messageElement?.textContent).toBe('Welcome to Pounce components')
	})

	it('renders with custom name', () => {
		const mount = h(HelloWorld, { name: 'Alice' })
		const rootElement = mount.render(rootEnv)[0] as HTMLElement

		const greetingElement = rootElement.querySelector('.greeting')
		expect(greetingElement?.textContent).toBe('Hello, Alice!')
	})

	it('renders with custom greeting', () => {
		const mount = h(HelloWorld, { greeting: 'Hi', name: 'Bob' })
		const rootElement = mount.render(rootEnv)[0] as HTMLElement

		const greetingElement = rootElement.querySelector('.greeting')
		expect(greetingElement?.textContent).toBe('Hi, Bob!')
	})

	it('has correct CSS classes', () => {
		const mount = h(HelloWorld, {})
		const rootElement = mount.render(rootEnv)[0] as HTMLElement

		// The root element itself should have the hello-world class
		expect(rootElement.classList.contains('hello-world')).toBe(true)

		const greetingElement = rootElement.querySelector('.greeting')
		const messageElement = rootElement.querySelector('.message')

		expect(greetingElement).toBeTruthy()
		expect(messageElement).toBeTruthy()
	})

	it('renders h1 and p elements with correct tags', () => {
		const mount = h(HelloWorld, {})
		const rootElement = mount.render(rootEnv)[0] as HTMLElement

		const h1Element = rootElement.querySelector('h1')
		const pElement = rootElement.querySelector('p')

		expect(h1Element?.tagName).toBe('H1')
		expect(pElement?.tagName).toBe('P')
		expect(h1Element?.classList.contains('greeting')).toBe(true)
		expect(pElement?.classList.contains('message')).toBe(true)
	})
})

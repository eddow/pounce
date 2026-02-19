import { document, latch } from '@pounce/core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { installTestAdapter, resetAdapter } from '../../tests/test-adapter'
import { Multiselect } from './multiselect'

describe('Multiselect', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
		installTestAdapter()
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = latch(container, element)
	}

	const colors = ['red', 'green', 'blue']

	it('renders <details> with adapter base class', () => {
		const selected = new Set<string>()
		render(
			<Multiselect
				items={colors}
				value={selected}
				renderItem={(c, on) => <span>{on ? '✓ ' : ''}{c}</span>}
			>
				<button>Pick</button>
			</Multiselect>
		)
		const details = container.querySelector('details.test-multiselect')
		expect(details).toBeTruthy()
	})

	it('renders with default pounce class when no adapter', () => {
		resetAdapter()
		const selected = new Set<string>()
		render(
			<Multiselect
				items={colors}
				value={selected}
				renderItem={(c) => <span>{c}</span>}
			>
				<button>Pick</button>
			</Multiselect>
		)
		const details = container.querySelector('details.pounce-multiselect')
		expect(details).toBeTruthy()
	})

	it('renders summary with trigger element', () => {
		const selected = new Set<string>()
		render(
			<Multiselect
				items={colors}
				value={selected}
				renderItem={(c) => <span>{c}</span>}
			>
				<button>Pick color</button>
			</Multiselect>
		)
		const summary = container.querySelector('summary')
		expect(summary).toBeTruthy()
		expect(summary?.textContent).toContain('Pick color')
	})

	it('renders listbox with options', () => {
		const selected = new Set<string>()
		render(
			<Multiselect
				items={colors}
				value={selected}
				renderItem={(c) => <span>{c}</span>}
			>
				<button>Pick</button>
			</Multiselect>
		)
		const listbox = container.querySelector('[role="listbox"]')
		expect(listbox).toBeTruthy()
		expect(listbox?.getAttribute('aria-multiselectable')).toBe('true')
		const options = listbox?.querySelectorAll('[role="option"]')
		expect(options?.length).toBe(3)
	})

	it('uses adapter menu class', () => {
		const selected = new Set<string>()
		render(
			<Multiselect
				items={colors}
				value={selected}
				renderItem={(c) => <span>{c}</span>}
			>
				<button>Pick</button>
			</Multiselect>
		)
		const menu = container.querySelector('.test-multiselect-menu')
		expect(menu).toBeTruthy()
	})

	it('renders aria-selected on selected items', () => {
		const selected = new Set(['green'])
		render(
			<Multiselect
				items={colors}
				value={selected}
				renderItem={(c, on) => <span>{on ? '✓ ' : ''}{c}</span>}
			>
				<button>Pick</button>
			</Multiselect>
		)
		const options = container.querySelectorAll('[role="option"]')
		expect(options.length).toBe(3)
		expect(options[1]?.hasAttribute('aria-selected')).toBe(true)
	})

	it('hides items when renderItem returns false', () => {
		const selected = new Set<string>()
		render(
			<Multiselect
				items={colors}
				value={selected}
				renderItem={(c) => c === 'green' ? false : <span>{c}</span>}
			>
				<button>Pick</button>
			</Multiselect>
		)
		const options = container.querySelectorAll('[role="option"]')
		expect(options.length).toBe(2)
	})
})

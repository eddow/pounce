import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { Badge, Pill, Chip } from '../../src/components/status'
import { resetAdapter } from '../../src/adapter/registry'

describe('Badge', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with default class', () => {
		render(<Badge>New</Badge>)
		const badge = container.querySelector('.pounce-badge')
		expect(badge).toBeTruthy()
		expect(badge?.textContent).toContain('New')
	})

	it('renders with icon', () => {
		render(<Badge icon="info">Info</Badge>)
		const icon = container.querySelector('.pounce-token-icon')
		expect(icon).toBeTruthy()
	})
})

describe('Pill', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with default class', () => {
		render(<Pill>Active</Pill>)
		const pill = container.querySelector('.pounce-pill')
		expect(pill).toBeTruthy()
		expect(pill?.textContent).toContain('Active')
	})

	it('renders with trailing icon', () => {
		render(<Pill trailingIcon="arrow-right">Next</Pill>)
		const icons = container.querySelectorAll('.pounce-token-icon')
		expect(icons.length).toBe(1)
	})
})

describe('Chip', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with default class', () => {
		render(<Chip>Tag</Chip>)
		const chip = container.querySelector('.pounce-chip')
		expect(chip).toBeTruthy()
		expect(chip?.textContent).toContain('Tag')
	})

	it('renders dismissible chip', () => {
		render(<Chip dismissible={true}>Remove me</Chip>)
		const dismiss = container.querySelector('.pounce-chip-dismiss')
		expect(dismiss).toBeTruthy()
		expect(dismiss?.getAttribute('aria-label')).toBe('Remove')
	})
})

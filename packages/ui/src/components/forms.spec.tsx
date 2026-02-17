import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { Select, Combobox, Checkbox, Radio, Switch } from '../../src/components/forms'
import { resetAdapter } from '../../src/adapter/registry'

describe('Select', () => {
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
		unmount = latch(container, element)
	}

	it('renders with default class', () => {
		render(
			<Select>
				<option value="a">A</option>
				<option value="b">B</option>
			</Select>
		)
		const select = container.querySelector('.pounce-select')
		expect(select).toBeTruthy()
	})

	it('renders full width', () => {
		render(<Select fullWidth={true}><option>X</option></Select>)
		const select = container.querySelector('.pounce-select')
		expect(select?.classList.contains('pounce-select-full')).toBe(true)
	})
})

describe('Combobox', () => {
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
		unmount = latch(container, element)
	}

	it('renders with input and datalist', () => {
		render(<Combobox options={['foo', 'bar']} />)
		const wrapper = container.querySelector('.pounce-combobox')
		expect(wrapper).toBeTruthy()
		const input = wrapper?.querySelector('input')
		expect(input).toBeTruthy()
		const datalist = wrapper?.querySelector('datalist')
		expect(datalist).toBeTruthy()
	})
})

describe('Checkbox', () => {
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
		unmount = latch(container, element)
	}

	it('renders with label', () => {
		render(<Checkbox label="Accept terms" />)
		const control = container.querySelector('.pounce-control')
		expect(control).toBeTruthy()
		const input = control?.querySelector('input[type="checkbox"]')
		expect(input).toBeTruthy()
		expect(control?.textContent).toContain('Accept terms')
	})

	it('renders checked state', () => {
		render(<Checkbox label="On" checked={true} />)
		const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
		expect(input?.checked).toBe(true)
	})

	it('targets input with el and label-wrapper with namespaced label props', () => {
		render(<Checkbox el={{ id: 'foo', tabIndex: 5 }} {...({ 'label:class': 'custom-label' } as any)}>Label</Checkbox>)
		const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement
		expect(input?.id).toBe('foo')
		expect(input?.tabIndex).toBe(5)
		const label = container.querySelector('label')
		expect(label?.classList.contains('custom-label')).toBe(true)
		expect(label?.textContent).toContain('Label')
	})
})

describe('Radio', () => {
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
		unmount = latch(container, element)
	}

	it('renders with label', () => {
		render(<Radio label="Option A" name="group" />)
		const control = container.querySelector('.pounce-radio')
		expect(control).toBeTruthy()
		const input = control?.querySelector('input[type="radio"]')
		expect(input).toBeTruthy()
		expect(control?.textContent).toContain('Option A')
	})
})

describe('Switch', () => {
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
		unmount = latch(container, element)
	}

	it('renders with switch role', () => {
		render(<Switch label="Dark mode" />)
		const input = container.querySelector('input[role="switch"]')
		expect(input).toBeTruthy()
	})

	it('renders label at start position', () => {
		render(<Switch label="Notifications" labelPosition="start" />)
		const control = container.querySelector('.pounce-switch')
		expect(control?.classList.contains('pounce-switch-label-start')).toBe(true)
	})
})

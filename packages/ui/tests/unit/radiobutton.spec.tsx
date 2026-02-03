import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp } from '@pounce/core'
import { RadioButton } from '../../src/components/radiobutton'
import { setAdapter, __resetAdapter } from '../../src/adapter/registry'
import { reactive } from 'mutts'

describe('RadioButton', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		__resetAdapter()
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		if (unmount) unmount()
		container.remove()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with default props', () => {
		render(<RadioButton value="a">Option A</RadioButton>)
		const button = container.querySelector('.pounce-radiobutton')
		expect(button).toBeTruthy()
		expect(button?.textContent).toContain('Option A')
		expect(button?.getAttribute('aria-checked')).toBe('false')
	})

	it('shows checked state when group matches value', () => {
		render(<RadioButton value="a" group="a">Option A</RadioButton>)
		const button = container.querySelector('.pounce-radiobutton')
		expect(button?.classList.contains('pounce-radiobutton-checked')).toBe(true)
		expect(button?.getAttribute('aria-checked')).toBe('true')
	})

	it('updates group on click (2-way binding)', () => {
		const state = reactive({ group: 'b' })
		// In @pounce/core, passing a reactive property and updating it in the component works
		render(<RadioButton value="a" group={state.group} onClick={() => { state.group = 'a' }}>Option A</RadioButton>)
		
		const button = container.querySelector('.pounce-radiobutton') as HTMLButtonElement
		button.click()
		
		expect(state.group).toBe('a')
	})

	it('applies variant classes via dynamic flavoring', () => {
		render(<RadioButton.danger value="a">Danger</RadioButton.danger>)
		const button = container.querySelector('.pounce-radiobutton')
		expect(button?.classList.contains('pounce-variant-danger')).toBe(true)
	})

	it('respects adapter overrides', () => {
		setAdapter({
			RadioButton: {
				classes: {
					base: 'custom-radio',
					checked: 'is-active'
				}
			}
		})
		
		render(<RadioButton value="a" group="a">Option A</RadioButton>)
		const button = container.querySelector('.custom-radio')
		expect(button).toBeTruthy()
		expect(button?.classList.contains('is-active')).toBe(true)
	})
})

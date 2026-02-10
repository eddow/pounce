import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { ButtonGroup } from '../../src/components/buttongroup'
import { Button } from '../../src/components/button'
import { resetAdapter } from '../../src/adapter/registry'

describe('ButtonGroup', () => {
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

	it('renders horizontal group by default', () => {
		render(
			<ButtonGroup>
				<Button>A</Button>
				<Button>B</Button>
			</ButtonGroup>
		)
		const group = container.querySelector('.pounce-buttongroup')
		expect(group).toBeTruthy()
		expect(group?.classList.contains('pounce-buttongroup-horizontal')).toBe(true)
		expect(group?.getAttribute('role')).toBe('group')
	})

	it('renders vertical group', () => {
		render(
			<ButtonGroup orientation="vertical">
				<Button>A</Button>
			</ButtonGroup>
		)
		const group = container.querySelector('.pounce-buttongroup')
		expect(group?.classList.contains('pounce-buttongroup-vertical')).toBe(true)
	})

	it('renders children', () => {
		render(
			<ButtonGroup>
				<Button>First</Button>
				<Button>Second</Button>
			</ButtonGroup>
		)
		const buttons = container.querySelectorAll('.pounce-button')
		expect(buttons.length).toBe(2)
	})
})

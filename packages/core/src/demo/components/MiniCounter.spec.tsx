import { h, rootEnv } from '@pounce/core'
import { reactive } from 'mutts'
import { describe, expect, it } from 'vitest'
import { MiniCounter } from './MiniCounter'

describe('MiniCounter Component', () => {
	it('renders with default props', () => {
		const mount = h('div', {}, h(MiniCounter, {}))
		const root = mount.render(rootEnv) as HTMLElement

		const input = root.querySelector('input[type="text"]')
		expect(input).toBeTruthy()

		const addButton = root.querySelector('button.add')
		expect(addButton).toBeTruthy()

		const removeButtons = root.querySelectorAll('button.remove')
		expect(removeButtons.length).toBe(0)

		const removeAllButton = root.querySelector('button.remove-all')
		expect(removeAllButton).toBeFalsy()
	})

	it('renders with custom list and addedText', () => {
		const mount = h('div', {}, h(MiniCounter, { list: ['Item1', 'Item2'], addedText: 'NewItem' }))
		const root = mount.render(rootEnv) as HTMLElement

		const input = root.querySelector('input[type="text"]') as HTMLInputElement
		expect(input?.value).toBe('NewItem')

		const removeButtons = root.querySelectorAll('button.remove')
		expect(removeButtons.length).toBe(2)
		expect(removeButtons[0]?.textContent).toBe('Item1')
		expect(removeButtons[1]?.textContent).toBe('Item2')

		const removeAllButton = root.querySelector('button.remove-all')
		expect(removeAllButton).toBeTruthy()
	})

	it('has correct CSS classes', () => {
		const mount = h('div', {}, h(MiniCounter, { list: ['Test'] }))
		const root = mount.render(rootEnv) as HTMLElement

		const listItems = root.querySelectorAll('button.remove')
		expect(listItems.length).toBeGreaterThan(0)
		expect(listItems[0]?.classList.contains('remove')).toBe(true)

		const addButton = root.querySelector('button.add')
		expect(addButton?.classList.contains('add')).toBe(true)

		const removeAllButton = root.querySelector('button.remove-all')
		expect(removeAllButton?.classList.contains('remove-all')).toBe(true)
	})

	it('renders input and buttons with correct tags', () => {
		const mount = h('div', {}, h(MiniCounter, {}))
		const root = mount.render(rootEnv) as HTMLElement

		const input = root.querySelector('input')
		expect(input?.tagName).toBe('INPUT')
		expect(input?.getAttribute('type')).toBe('text')

		const addButton = root.querySelector('button.add')
		expect(addButton?.tagName).toBe('BUTTON')
		expect(addButton?.textContent?.trim()).toBe('+')
	})

	it('shows Remove All after adding an item dynamically', () => {
		const list = reactive([] as string[])
		const mount = h('div', {}, h(MiniCounter, { list }))
		const root = mount.render(rootEnv) as HTMLElement

		// Initially hidden
		expect(root.querySelector('button.remove-all')).toBeFalsy()

		// Add an item
		list.push('hello')

		// Should now appear
		expect(root.querySelector('button.remove-all')).toBeTruthy()
		expect(root.querySelector('button.remove-all')?.textContent?.trim()).toBe('Remove All')
	})

	it('shows Remove All in nested App with list.join sibling', () => {
		const state = reactive({ list: [] as string[] })
		function App() {
			return (
				<>
					<div>
						List: <span>{state.list.join(', ')}</span>
					</div>
					<MiniCounter list={state.list} />
				</>
			)
		}
		const mount = h('div', {}, h(App, {}))
		const root = mount.render(rootEnv) as HTMLElement

		expect(root.querySelector('button.remove-all')).toBeFalsy()
		state.list.push('hello')
		expect(root.querySelector('button.remove-all')).toBeTruthy()
	})

	it('shows Remove All when triggered via button click', () => {
		const state = reactive({ list: [] as string[] })
		function App() {
			return (
				<>
					<div>
						List: <span>{state.list.join(', ')}</span>
					</div>
					<MiniCounter list={state.list} />
				</>
			)
		}
		const mount = <App />
		const root = mount.render(rootEnv) as HTMLElement

		expect(root.querySelector('button.remove-all')).toBeFalsy()

		// Simulate clicking the add button (same path as browser)
		const addBtn = root.querySelector('button.add') as HTMLButtonElement
		addBtn.click()

		expect(root.querySelector('button.remove')).toBeTruthy()
		expect(root.querySelector('button.remove-all')).toBeTruthy()
	})
})

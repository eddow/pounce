import { describe, expect, it } from 'vitest'
import { h, rootScope } from '../../lib'
import { MiniCounter } from './MiniCounter'

describe('MiniCounter Component', () => {
	it('renders with default props', () => {
		const mount = h('div', {}, h(MiniCounter, {}))
		const root = mount.render(rootScope) as HTMLElement

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
		const root = mount.render(rootScope) as HTMLElement

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
		const root = mount.render(rootScope) as HTMLElement

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
		const root = mount.render(rootScope) as HTMLElement

		const input = root.querySelector('input')
		expect(input?.tagName).toBe('INPUT')
		expect(input?.getAttribute('type')).toBe('text')

		const addButton = root.querySelector('button.add')
		expect(addButton?.tagName).toBe('BUTTON')
		expect(addButton?.textContent?.trim()).toBe('+')
	})
})

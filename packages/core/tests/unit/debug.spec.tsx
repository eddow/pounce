/**
 * Test component association debug tools
 */
import { describe, test, expect } from 'vitest'
import { reactive } from 'mutts'
import { getComponentInstance, getComponentHierarchy, rootComponents, h, r } from '@pounce/core'

describe('Component association debug tools', () => {
	// ... (tests 1 and 2 unchanged)

	test('should maintain association in reactive updates', async () => {
		const state = reactive({ show: true })

		const Conditional = () => <div>{state.show ? <span id="true-branch">True</span> : <span id="false-branch">False</span>}</div>

		const mount = h(Conditional, {})
		const root = (mount.render()[0] as HTMLElement)

		const trueSpan = root.querySelector('#true-branch') as HTMLElement
		expect(getComponentInstance(trueSpan)?.name).toBe('Conditional')

		state.show = false
		const falseSpan = root.querySelector('#false-branch') as HTMLElement
		expect(falseSpan).toBeDefined()
		expect(getComponentInstance(falseSpan)?.name).toBe('Conditional')
	})

	test('should work with morphing', () => {
		const state = reactive({ items: ['A', 'B'] })

		const ListComponent = () => <ul><for each={state.items}>{(item) => <li class="item">{item}</li>}</for></ul>

		const mount = h(ListComponent, {})
		const root = (mount.render()[0] as HTMLElement)

		const items = root.querySelectorAll('.item')
		expect(items.length).toBe(2)
		// ...

		for (const item of items) {
			const hierarchy = getComponentHierarchy(item as HTMLElement)
			expect(hierarchy.some((h: any) => h.name === 'ListComponent')).toBe(true)
		}

		state.items.push('C')
		const newItem = root.querySelectorAll('.item')[2]
		expect(newItem).toBeDefined()
		expect(getComponentHierarchy(newItem as HTMLElement).some(h => h.name === 'ListComponent')).toBe(true)
	})

	test('should track root components', () => {
		const initialSize = rootComponents.size

		const Root = () => h('div', {}, 'Root')
		const mount = h(Root, {})
		mount.render()

		expect(rootComponents.size).toBe(initialSize + 1)

		const infos = Array.from(rootComponents)
		expect(infos.some((i: any) => i.name === 'Root')).toBe(true)
	})
})

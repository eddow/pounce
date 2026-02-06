/**
 * Test component association debug tools
 */
import { describe, test, expect } from 'vitest'
import { reactive } from 'mutts'
import { getComponentInstance, getComponentHierarchy, rootComponents, h } from '@pounce/core'

describe('Component association debug tools', () => {
	test('should associate DOM elements with their owner component', () => {
		const Child = () => h('div', { id: 'child-element' }, 'Child')
		const Parent = () => h('div', { id: 'parent-element' }, [h(Child, {})])

		const mount = h(Parent, {})
		const root = (mount.render() as HTMLElement[])[0]

		const parentDiv = root
		const childDiv = root.querySelector('#child-element') as HTMLElement

		const parentInfo = getComponentInstance(parentDiv)
		const childInfo = getComponentInstance(childDiv)

		expect(parentInfo).toBeDefined()
		expect(parentInfo?.name).toBe('Parent')

		expect(childInfo).toBeDefined()
		expect(childInfo?.name).toBe('Child')
		expect(childInfo?.parent).toBe(parentInfo)
	})

	test('should trace hierarchy back to root', () => {
		const GrandChild = () => h('span', { id: 'target' }, 'GC')
		const Child = () => h('div', {}, [h(GrandChild, {})])
		const Parent = () => h('div', {}, [h(Child, {})])

		const mount = h(Parent, {})
		const root = (mount.render() as HTMLElement[])[0]
		const target = root.querySelector('#target') as HTMLElement

		const hierarchy = getComponentHierarchy(target)
		expect(hierarchy.map((h: any) => h.name)).toEqual(['GrandChild', 'Child', 'Parent'])
	})

	test('should maintain association in reactive updates', async () => {
		const state = reactive({ show: true })

		const Conditional = () => h('div', {}, [
			(() => state.show ? h('span', { id: 'true-branch' }, 'True') : h('span', { id: 'false-branch' }, 'False')) as any
		])

		const mount = h(Conditional, {})
		const root = (mount.render() as HTMLElement[])[0]

		const trueSpan = root.querySelector('#true-branch') as HTMLElement
		expect(getComponentInstance(trueSpan)?.name).toBe('Conditional')

		state.show = false
		const falseSpan = root.querySelector('#false-branch') as HTMLElement
		expect(falseSpan).toBeDefined()
		expect(getComponentInstance(falseSpan)?.name).toBe('Conditional')
	})

	test('should work with projections', () => {
		const state = reactive({ items: ['A', 'B'] })

		const ListComponent = () => h('ul', {},
			h('for', { each: state.items } as any,
				(() => (item: string) => h('li', { class: 'item' }, item)) as any
			)
		)

		const mount = h(ListComponent, {})
		const root = (mount.render() as HTMLElement[])[0]

		const items = root.querySelectorAll('.item')
		expect(items.length).toBe(2)

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

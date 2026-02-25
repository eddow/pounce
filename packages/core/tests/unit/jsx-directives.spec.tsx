import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { reactive } from 'mutts'

describe('JSX Directives: fragment, dynamic, and for', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
	})

	afterEach(() => {
		unmount?.()
		container.remove()
	})

	describe('fragment', () => {
		it('renders children without wrapper element', () => {
			unmount = latch(
				container,
				<div class="outer">
					<fragment>
						<span class="child1">Child 1</span>
						<span class="child2">Child 2</span>
					</fragment>
				</div>
			)

			const outer = container.querySelector('.outer')!
			expect(outer.children.length).toBe(2)
			expect(outer.querySelector('.child1')?.textContent).toBe('Child 1')
			expect(outer.querySelector('.child2')?.textContent).toBe('Child 2')
		})

		it('renders single child correctly', () => {
			unmount = latch(
				container,
				<div class="outer">
					<fragment>
						<span class="only-child">Only Child</span>
					</fragment>
				</div>
			)

			const outer = container.querySelector('.outer')!
			expect(outer.children.length).toBe(1)
			expect(outer.querySelector('.only-child')?.textContent).toBe('Only Child')
		})

		it('renders nested fragments correctly', () => {
			unmount = latch(
				container,
				<div class="outer">
					<fragment>
						<fragment>
							<span class="nested">Nested</span>
						</fragment>
						<span class="sibling">Sibling</span>
					</fragment>
				</div>
			)

			const outer = container.querySelector('.outer')!
			expect(outer.children.length).toBe(2)
			expect(outer.querySelector('.nested')?.textContent).toBe('Nested')
			expect(outer.querySelector('.sibling')?.textContent).toBe('Sibling')
		})

		it('renders empty fragment', () => {
			unmount = latch(
				container,
				<div class="outer">
					<fragment></fragment>
					<span class="after">After</span>
				</div>
			)

			const outer = container.querySelector('.outer')!
			expect(outer.children.length).toBe(1)
			expect(outer.querySelector('.after')?.textContent).toBe('After')
		})

		it('handles conditional rendering within fragment', () => {
			const state = reactive({ show: true })
			
			unmount = latch(
				container,
				<div class="outer">
					<fragment>
						<span class="always">Always</span>
						<span if={state.show} class="conditional">Conditional</span>
					</fragment>
				</div>
			)

			const outer = container.querySelector('.outer')!
			expect(outer.children.length).toBe(2)
			expect(outer.querySelector('.conditional')).not.toBeNull()

			state.show = false
			expect(outer.children.length).toBe(1)
			expect(outer.querySelector('.conditional')).toBeNull()
		})

		it('preserves order with multiple fragments', () => {
			unmount = latch(
				container,
				<div class="outer">
					<fragment>
						<span class="item1">Item 1</span>
					</fragment>
					<fragment>
						<span class="item2">Item 2</span>
						<span class="item3">Item 3</span>
					</fragment>
					<span class="item4">Item 4</span>
				</div>
			)

			const outer = container.querySelector('.outer')!
			expect(outer.children.length).toBe(4)
			
			const items = Array.from(outer.children)
			expect(items[0].className).toBe('item1')
			expect(items[1].className).toBe('item2')
			expect(items[2].className).toBe('item3')
			expect(items[3].className).toBe('item4')
		})
	})

	describe('dynamic', () => {
		it('renders with initial tag', () => {
			unmount = latch(
				container,
				<dynamic tag="button" class="dynamic-btn">Click me</dynamic>
			)

			const element = container.querySelector('.dynamic-btn')!
			expect(element.tagName).toBe('BUTTON')
			expect(element.textContent).toBe('Click me')
		})

		it('changes tag when reactive tag changes', () => {
			const state = reactive({ tag: 'button' as keyof HTMLElementTagNameMap })
			
			unmount = latch(
				container,
				<dynamic tag={state.tag} class="dynamic">Content</dynamic>
			)

			let element = container.querySelector('.dynamic')!
			expect(element.tagName).toBe('BUTTON')

			state.tag = 'div'
			element = container.querySelector('.dynamic')!
			expect(element.tagName).toBe('DIV')
			expect(element.textContent).toBe('Content')
		})

		it('preserves attributes when tag changes', () => {
			const state = reactive({ tag: 'button' as keyof HTMLElementTagNameMap })
			
			unmount = latch(
				container,
				<dynamic 
					tag={state.tag} 
					class="preserved" 
					data-test="value"
					disabled
				>
					Content
				</dynamic>
			)

			state.tag = 'div'
			const element = container.querySelector('.preserved')!
			expect(element.tagName).toBe('DIV')
			expect(element.getAttribute('data-test')).toBe('value')
			expect(element.hasAttribute('disabled')).toBe(true)
		})

		it('supports component as tag', () => {
			const CustomComponent = (props: { class?: string; children?: any }) => 
				<span class={props.class}>{props.children}</span>
			
			unmount = latch(
				container,
				<dynamic tag={CustomComponent} class="custom-component">
					From Component
				</dynamic>
			)

			const element = container.querySelector('.custom-component')!
			expect(element.tagName).toBe('SPAN')
			expect(element.textContent).toBe('From Component')
		})

		it('handles dynamic children', () => {
			const state = reactive({ text: 'Initial' })
			
			unmount = latch(
				container,
				<dynamic tag="div" class="dynamic">
					{state.text}
				</dynamic>
			)

			const element = container.querySelector('.dynamic')!
			expect(element.textContent).toBe('Initial')

			state.text = 'Updated'
			expect(element.textContent).toBe('Updated')
		})

		it('supports event handlers', () => {
			let clicked = false
			
			unmount = latch(
				container,
				<dynamic 
					tag="button" 
					onClick={() => clicked = true}
					class="clickable"
				>
					Click
				</dynamic>
			)

			const button = container.querySelector('.clickable') as HTMLButtonElement
			button.click()
			expect(clicked).toBe(true)
		})

		it('maintains node identity when tag does not change', () => {
			const state = reactive({ count: 0 })
			
			unmount = latch(
				container,
				<dynamic tag="div" class="stable" data-count={state.count}>
					Content
				</dynamic>
			)

			const element = container.querySelector('.stable')!
			const initialElement = element

			state.count = 1
			const updatedElement = container.querySelector('.stable')!
			expect(initialElement).toBe(updatedElement)
			expect(updatedElement.getAttribute('data-count')).toBe('1')
		})
	})

	describe('for', () => {
		it('renders list of items', () => {
			const items = reactive(['a', 'b', 'c'])
			
			unmount = latch(
				container,
				<ul class="list">
					<for each={items}>
						{(item) => <li class="item">{item}</li>}
					</for>
				</ul>
			)

			const list = container.querySelector('.list')!
			const listItems = list.querySelectorAll('.item')
			expect(listItems.length).toBe(3)
			expect(listItems[0].textContent).toBe('a')
			expect(listItems[1].textContent).toBe('b')
			expect(listItems[2].textContent).toBe('c')
		})

		it('renders empty list when array is empty', () => {
			const items: string[] = []
			
			unmount = latch(
				container,
				<div class="container">
					<for each={items}>
						{(item) => <div class="item">{item}</div>}
					</for>
				</div>
			)

			const containerEl = container.querySelector('.container')!
			expect(containerEl.children.length).toBe(0)
		})

		it('reactively updates when items are added', () => {
			const items = reactive(['first'])
			
			unmount = latch(
				container,
				<div class="container">
					<for each={items}>
						{(item) => <div class="item">{item}</div>}
					</for>
				</div>
			)

			let containerEl = container.querySelector('.container')!
			expect(containerEl.children.length).toBe(1)

			items.push('second')
			containerEl = container.querySelector('.container')!
			const listItems = containerEl.querySelectorAll('.item')
			expect(listItems.length).toBe(2)
			expect(listItems[0].textContent).toBe('first')
			expect(listItems[1].textContent).toBe('second')
		})

		it('reactively updates when items are removed', () => {
			const items = reactive(['first', 'second', 'third'])
			
			unmount = latch(
				container,
				<div class="container">
					<for each={items}>
						{(item) => <div class="item">{item}</div>}
					</for>
				</div>
			)

			items.splice(1, 1) // Remove 'second'
			const containerEl = container.querySelector('.container')!
			const listItems = containerEl.querySelectorAll('.item')
			expect(listItems.length).toBe(2)
			expect(listItems[0].textContent).toBe('first')
			expect(listItems[1].textContent).toBe('third')
		})

		it('handles complex objects in list', () => {
			interface User {
				id: number
				name: string
			}
			const users = reactive<User[]>([
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' }
			])
			
			unmount = latch(
				container,
				<div class="users">
					<for each={users}>
						{(user) => (
							<div class="user" data-id={user.id}>
								{user.name}
							</div>
						)}
					</for>
				</div>
			)

			const containerEl = container.querySelector('.users')!
			const userElements = containerEl.querySelectorAll('.user')
			expect(userElements.length).toBe(2)
			expect(userElements[0].getAttribute('data-id')).toBe('1')
			expect(userElements[0].textContent).toBe('Alice')
			expect(userElements[1].getAttribute('data-id')).toBe('2')
			expect(userElements[1].textContent).toBe('Bob')
		})

		it('preserves element identity for stable items', () => {
			const items = reactive(['stable'])
			
			unmount = latch(
				container,
				<div class="container">
					<for each={items}>
						{(item) => <div class="item" data-value={item}>{item}</div>}
					</for>
				</div>
			)

			// Add another item
			items.push('new')
			const elementsAfter = container.querySelectorAll('.item')
			expect(elementsAfter.length).toBe(2)
			// The first element should still exist and maintain its attributes
			expect(elementsAfter[0].getAttribute('data-value')).toBe('stable')
			expect(elementsAfter[0].textContent).toBe('stable')
			expect(elementsAfter[1].getAttribute('data-value')).toBe('new')
			expect(elementsAfter[1].textContent).toBe('new')
		})

		it('works with conditional rendering inside loop', () => {
			const items = reactive([
				{ text: 'show', visible: true },
				{ text: 'hide', visible: false },
				{ text: 'show2', visible: true }
			])
			
			unmount = latch(
				container,
				<div class="container">
					<for each={items}>
						{(item) => (
							<div if={item.visible} class="item">
								{item.text}
							</div>
						)}
					</for>
				</div>
			)

			const visibleItems = container.querySelectorAll('.item')
			expect(visibleItems.length).toBe(2)
			expect(visibleItems[0].textContent).toBe('show')
			expect(visibleItems[1].textContent).toBe('show2')
		})

		it('handles null/undefined returns from render function', () => {
			const items = reactive(['show', 'hide', 'show2'])
			
			unmount = latch(
				container,
				<div class="container">
					<for each={items}>
						{(item) => 
							item === 'hide' ? null : <div class="item">{item}</div>
						}
					</for>
				</div>
			)

			const visibleItems = container.querySelectorAll('.item')
			expect(visibleItems.length).toBe(2)
			expect(visibleItems[0].textContent).toBe('show')
			expect(visibleItems[1].textContent).toBe('show2')
		})

		it('works with nested fragments', () => {
			const items = reactive(['a', 'b'])
			
			unmount = latch(
				container,
				<div class="container">
					<for each={items}>
						{(item) => (
							<fragment>
								<span class="prefix">Prefix:</span>
								<span class="item">{item}</span>
							</fragment>
						)}
					</for>
				</div>
			)

			const containerEl = container.querySelector('.container')!
			expect(containerEl.children.length).toBe(4) // 2 items * 2 spans each
			
			const prefixes = containerEl.querySelectorAll('.prefix')
			const itemSpans = containerEl.querySelectorAll('.item')
			expect(prefixes.length).toBe(2)
			expect(itemSpans.length).toBe(2)
			expect(itemSpans[0].textContent).toBe('a')
			expect(itemSpans[1].textContent).toBe('b')
		})
	})

	describe('combined directives', () => {
		it('works with fragment containing for loop', () => {
			const items = reactive(['x', 'y'])
			
			unmount = latch(
				container,
				<div class="outer">
					<fragment>
						<span class="before">Before</span>
						<for each={items}>
							{(item) => <div class="item">{item}</div>}
						</for>
						<span class="after">After</span>
					</fragment>
				</div>
			)

			const outer = container.querySelector('.outer')!
			expect(outer.children.length).toBe(4) // before + 2 items + after
			expect(outer.querySelector('.before')?.textContent).toBe('Before')
			expect(outer.querySelector('.after')?.textContent).toBe('After')
			
			const itemsEl = outer.querySelectorAll('.item')
			expect(itemsEl.length).toBe(2)
		})

		it('works with dynamic tag containing for loop', () => {
			const items = reactive(['1', '2'])
			const tag = reactive({ name: 'ul' as keyof HTMLElementTagNameMap })
			
			unmount = latch(
				container,
				<dynamic tag={tag.name} class="list">
					<for each={items}>
						{(item) => <li class="item">{item}</li>}
					</for>
				</dynamic>
			)

			let list = container.querySelector('.list')!
			expect(list.tagName).toBe('UL')
			expect(list.querySelectorAll('.item').length).toBe(2)

			tag.name = 'ol'
			list = container.querySelector('.list')!
			expect(list.tagName).toBe('OL')
			expect(list.querySelectorAll('.item').length).toBe(2)
		})

		it('works with for loop rendering dynamic tags', () => {
			const items = reactive([
				{ tag: 'button' as const, text: 'Click' },
				{ tag: 'div' as const, text: 'Box' },
				{ tag: 'span' as const, text: 'Text' }
			])
			
			unmount = latch(
				container,
				<div class="container">
					<for each={items}>
						{(item) => (
							<dynamic tag={item.tag} class="dynamic-item">
								{item.text}
							</dynamic>
						)}
					</for>
				</div>
			)

			const containerEl = container.querySelector('.container')!
			const dynamicItems = containerEl.querySelectorAll('.dynamic-item')
			expect(dynamicItems.length).toBe(3)
			expect(dynamicItems[0].tagName).toBe('BUTTON')
			expect(dynamicItems[0].textContent).toBe('Click')
			expect(dynamicItems[1].tagName).toBe('DIV')
			expect(dynamicItems[1].textContent).toBe('Box')
			expect(dynamicItems[2].tagName).toBe('SPAN')
			expect(dynamicItems[2].textContent).toBe('Text')
		})
	})
})

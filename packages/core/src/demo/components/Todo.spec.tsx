import { h, rootEnv } from '@pounce/core'
import { project, reactive } from 'mutts'
import { describe, expect, it } from 'vitest'
import TodoWebComponent, { type Todo } from './Todo'

describe('TodoWebComponent', () => {
	it('project reacts to second push', () => {
		const source = reactive([] as { id: number; text: string }[])
		const result = project(source, ({ value }) => value.text)

		expect(result.length).toBe(0)

		source.push({ id: 1, text: 'First' })
		expect(result.length).toBe(1)
		expect(result[0]).toBe('First')

		source.push({ id: 2, text: 'Second' })
		expect(result.length).toBe(2)
		expect(result[1]).toBe('Second')
	})

	it('minimal for-each reacts to second push', () => {
		const items = reactive([] as { id: number; text: string }[])
		const mount = h(
			'div',
			{},
			h('for', { each: items }, ((item: any) => h('span', {}, item.text)) as any)
		)
		const root = mount.render(rootEnv) as HTMLElement

		expect(root.querySelectorAll('span').length).toBe(0)

		items.push({ id: 1, text: 'First' })
		expect(root.querySelectorAll('span').length).toBe(1)

		items.push({ id: 2, text: 'Second' })
		expect(root.querySelectorAll('span').length).toBe(2)
	})

	it('adds a second todo to the DOM', () => {
		const todos = reactive<Todo[]>([])
		const mount = h('div', {}, h(TodoWebComponent, { todos }))
		const root = mount.render(rootEnv) as HTMLElement

		expect(root.querySelectorAll('.todo-item').length).toBe(0)

		todos.push({ id: 1, text: 'First', completed: false, createdAt: new Date() })
		expect(root.querySelectorAll('.todo-item').length).toBe(1)
		expect(root.querySelector('.todo-item .todo-text')?.textContent).toBe('First')

		todos.push({ id: 2, text: 'Second', completed: false, createdAt: new Date() })
		expect(root.querySelectorAll('.todo-item').length).toBe(2)
	})

	it('shows correct text after remove and re-add', () => {
		const todos = reactive<Todo[]>([])
		const mount = h('div', {}, h(TodoWebComponent, { todos }))
		const root = mount.render(rootEnv) as HTMLElement

		todos.push({ id: 1, text: 'a', completed: false, createdAt: new Date() })
		expect(root.querySelector('.todo-item .todo-text')?.textContent).toBe('a')

		// Filter out the todo with id 1
		const filtered = todos.filter(todo => todo.id !== 1)
		todos.splice(0, todos.length, ...filtered)
		expect(root.querySelectorAll('.todo-item').length).toBe(0)

		todos.push({ id: 2, text: 'b', completed: false, createdAt: new Date() })
		expect(root.querySelectorAll('.todo-item').length).toBe(1)
		expect(root.querySelector('.todo-item .todo-text')?.textContent).toBe('b')
	})
})

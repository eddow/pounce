/**
 * Todo Web Component using inline JSX templating
 */

import { memoize } from 'mutts'
import './Todo.scss'
import { defaults } from '../../lib/utils'

export interface Todo {
	id: number
	text: string
	completed: boolean
	createdAt: Date
}

export default function TodoWebComponent(props: {
	placeholder?: string
	showFilters?: boolean
	showClearCompleted?: boolean
	maxTodos?: number
	allowEmptyTodos?: boolean
	todos: Todo[]
	filter?: 'all' | 'active' | 'completed'
	newTodoText?: string
}) {
	const vm = defaults(props, {
		placeholder: 'Add a new todo...',
		showFilters: true,
		showClearCompleted: true,
		filter: 'all',
		newTodoText: '',
	})
	function addTodo() {
		const text = vm.newTodoText.trim()
		const allowEmptyTodos = vm.allowEmptyTodos ?? false
		const maxTodos = vm.maxTodos

		// Validate based on typed props
		if (!text && !allowEmptyTodos) return
		if (maxTodos && props.todos.length >= maxTodos) return

		const newTodo: Todo = {
			id: Date.now(),
			text,
			completed: false,
			createdAt: new Date(),
		}

		props.todos.push(newTodo)
		vm.newTodoText = ''
	}

	function deleteTodo(removeId: number) {
		const idx = props.todos.findIndex((t) => t.id === removeId)
		if (idx > -1) props.todos.splice(idx, 1)
	}

	function clearCompleted() {
		// Example of in-place mutation without reassignment
		let i = props.todos.length
		while (i--) {
			if (props.todos[i].completed) {
				props.todos.splice(i, 1)
			}
		}
	}

	const computed = memoize({
		get activeCount() {
			return props.todos.reduce((count, todo) => count + (todo.completed ? 0 : 1), 0)
		},
		get completedCount() {
			return props.todos.reduce((count, todo) => count + (todo.completed ? 1 : 0), 0)
		},
		get filteredTodos() {
			switch (vm.filter) {
				case 'active':
					return props.todos.filter((todo) => !todo.completed)
				case 'completed':
					return props.todos.filter((todo) => todo.completed)
				default:
					// Return array to be consistent with other branches and <for> expectations
					return props.todos
			}
		},
	})
	return (
		<>
			<h2>Todo Component (JSX)</h2>

			{/* Input section */}
			<div class="input-section">
				<input
					type="text"
					class="todo-input"
					placeholder={vm.placeholder}
					value={vm.newTodoText}
					onKeypress={(e: KeyboardEvent) => e.key === 'Enter' && addTodo()}
				/>
				<button class="add-button" onClick={addTodo}>
					Add
				</button>
			</div>

			{/* Filter buttons */}
			<div if={vm.showFilters} class="filters">
				<button
					class={['filter-button', { active: vm.filter === 'all' }]}
					onClick={() => (vm.filter = 'all')}
				>
					All
				</button>
				<button
					class={['filter-button', { active: vm.filter === 'active' }]}
					onClick={() => (vm.filter = 'active')}
				>
					Active ({computed.activeCount})
				</button>
				<button
					class={['filter-button', { active: vm.filter === 'completed' }]}
					onClick={() => (vm.filter = 'completed')}
				>
					Completed ({computed.completedCount})
				</button>
			</div>

			{/* Todo list */}
			<>
				<div if={computed.filteredTodos.length > 0} class="todo-list">
					<for each={computed.filteredTodos}>
						{(todo) => (
							<div class="todo-item">
								<input type="checkbox" checked={todo.completed} />
								<span class={['todo-text', { completed: todo.completed }]}>{todo.text}</span>
								<button class="delete-button" onClick={() => deleteTodo(todo.id)}>
									Delete
								</button>
							</div>
						)}
					</for>
				</div>
				<div else class="empty-message">
					{props.todos.length === 0 ? 'No todos yet. Add one above!' : `No ${vm.filter} todos.`}
				</div>
			</>

			{/* Clear completed section */}
			<div if={vm.showClearCompleted && computed.completedCount > 0} class="clear-section">
				<button class="clear-button" onClick={clearCompleted}>
					Clear {computed.completedCount} completed
				</button>
			</div>
		</>
	)
}

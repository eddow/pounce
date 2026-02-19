/**
 * Todo Web Component using inline JSX templating
 */

import { memoize, type Register } from 'mutts'
import './Todo.scss'
import { extend } from '../../lib/utils'

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
	todos: Register<Todo, number>
	filter?: 'all' | 'active' | 'completed'
	newTodoText?: string
}) {
	const state = extend(
		{
			placeholder: 'Add a new todo...',
			showFilters: true,
			showClearCompleted: true,
			filter: 'all',
			newTodoText: '',
		},
		props
	)
	function addTodo() {
		const text = state.newTodoText.trim()
		const allowEmptyTodos = state.allowEmptyTodos ?? false
		const maxTodos = state.maxTodos

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
		state.newTodoText = ''
	}

	function deleteTodo(id: number) {
		props.todos.remove(id)
	}

	function clearCompleted() {
		props.todos.keep((todo) => !todo.completed)
	}

	const computed = memoize({
		get activeCount() {
			return props.todos.reduce((count, todo) => count + (todo.completed ? 0 : 1), 0)
		},
		get completedCount() {
			return props.todos.reduce((count, todo) => count + (todo.completed ? 1 : 0), 0)
		},
		get filteredTodos() {
			switch (state.filter) {
				case 'active':
					return props.todos.filter((todo) => !todo.completed)
				case 'completed':
					return props.todos.filter((todo) => todo.completed)
				default:
					// Return array to be consistent with other branches and <for> expectations
					return props.todos.toArray()
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
					placeholder={state.placeholder}
					value={state.newTodoText}
					onKeypress={(e: KeyboardEvent) => e.key === 'Enter' && addTodo()}
				/>
				<button class="add-button" onClick={addTodo}>
					Add
				</button>
			</div>

			{/* Filter buttons */}
			<div if={state.showFilters} class="filters">
				<button
					class={['filter-button', { active: state.filter === 'all' }]}
					onClick={() => (state.filter = 'all')}
				>
					All
				</button>
				<button
					class={['filter-button', { active: state.filter === 'active' }]}
					onClick={() => (state.filter = 'active')}
				>
					Active ({computed.activeCount})
				</button>
				<button
					class={['filter-button', { active: state.filter === 'completed' }]}
					onClick={() => (state.filter = 'completed')}
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
					{props.todos.length === 0 ? 'No todos yet. Add one above!' : `No ${state.filter} todos.`}
				</div>
			</>

			{/* Clear completed section */}
			<div if={state.showClearCompleted && computed.completedCount > 0} class="clear-section">
				<button class="clear-button" onClick={clearCompleted}>
					Clear {computed.completedCount} completed
				</button>
			</div>
		</>
	)
}

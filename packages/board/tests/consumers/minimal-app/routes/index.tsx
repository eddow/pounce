import { A } from '@pounce/board'
import { reactive } from 'mutts'

export default function IndexPage() {
	const state = reactive({ counter: 0 })

	return (
		<div>
			<h1>Index Page</h1>
			<p>Welcome to the minimal app!</p>
			<div id="counter-section">
				<p>Counter: <span id="counter-value">{() => state.counter}</span></p>
				<button id="increment-btn" onClick={() => state.counter++}>Increment</button>
			</div>
			<nav>
				<A href="/users/1" id="link-user-1">View User 1 (SPA)</A>
				{' | '}
				<A href="/users/2" id="link-user-2">View User 2 (SPA)</A>
				{' | '}
				<A href="/users/list" id="link-user-list">User List (SPA)</A>
			</nav>
		</div>
	)
}

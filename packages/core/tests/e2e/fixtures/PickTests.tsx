import { reactive } from 'mutts'
import type { Env } from '@pounce/core'

export default function PickTests(_: any, env: Env) {
	const state = reactive({
		view: 'A' as 'A' | 'B' | 'C',
		allowedViews: new Set(['A', 'B'])
	})

	env.views = (options: Set<string>) => {
		// Intersection of options and allowedViews
		return new Set([...options].filter(v => state.allowedViews.has(v) && state.view === v))
	}

	return (
		<div>
			<h1>Pick Directive Tests</h1>
			<div class="controls">
				<button data-action="set-view-a" onClick={() => state.view = 'A'}>Set A</button>
				<button data-action="set-view-b" onClick={() => state.view = 'B'}>Set B</button>
				<button data-action="set-view-c" onClick={() => state.view = 'C'}>Set C</button>
				<button data-action="allow-c" onClick={() => state.allowedViews.add('C')}>Allow C</button>
			</div>
			<div data-testid="pick-container">
				<div data-testid="view-a" pick:views="A">View A Content</div>
				<div data-testid="view-b" pick:views="B">View B Content</div>
				<div data-testid="view-c" pick:views="C">View C Content</div>
			</div>
			<p>Current View: <span data-testid="current-view">{state.view}</span></p>
			<p>Allowed: <span data-testid="allowed-views">{[...state.allowedViews].join(',')}</span></p>
		</div>
	)
}

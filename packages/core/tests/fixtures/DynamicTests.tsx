import { reactive } from 'mutts'

export default () => {
	const state = reactive({
		tag: 'button' as any,
		count: 0,
		text: 'Initial Text',
		className: 'blue',
		inputValue: 'Initial Value',
	})

	return (
		<div id="dynamic-test-root">
			<h1>Dynamic Tag Tests</h1>

			<div id="controls">
				<button id="toggle-tag" onClick={() => (state.tag = state.tag === 'button' ? 'div' : 'button')}>
					Switch Tag
				</button>
				<button id="increment-count" onClick={() => state.count++}>
					Increment Count
				</button>
				<button id="change-text" onClick={() => (state.text = 'Updated Text ' + state.count)}>
					Change Text
				</button>
				<button id="change-class" onClick={() => (state.className = state.className === 'blue' ? 'red' : 'blue')}>
					Change Class
				</button>
			</div>

			<section>
				<h2>Stability and Prop Sync</h2>
				<dynamic
					id="test-target"
					tag={state.tag as any}
					class={state.className}
					data-count={state.count}
					use={(el: HTMLElement) => {
						// Set a marker to detect recreation
						if (!(el as any).__marker) {
							(el as any).__marker = Math.random()
							console.log('[test:dynamic] Node created', (el as any).__marker)
						} else {
							console.log('[test:dynamic] Node reused', (el as any).__marker)
						}
					}}
				>
					<span id="target-label">{state.text}</span>
					<span id="target-count">{state.count}</span>
				</dynamic>
			</section>

			<section>
				<h2>Two-way Reactivity</h2>
				<dynamic
					id="test-input"
					tag="input"
					value={state.inputValue}
				/>
				<p>Input Value: <span id="input-display">{state.inputValue}</span></p>
				<button id="reset-input" onClick={() => state.inputValue = 'Reset'}>Reset Input</button>
			</section>

			<section>
				<h2>Function Props</h2>
				<dynamic
					id="test-click"
					tag="button"
					onClick={() => state.count += 10}
				>
					Click me (+10)
				</dynamic>
			</section>
		</div>
	)
}

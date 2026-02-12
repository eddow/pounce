import { bindApp, type Scope } from '@pounce/core'
import { reactive } from 'mutts'
import { MiniCounter } from './components/MiniCounter'

function isFunction(value: any): value is Function {
	return typeof value === 'function'
}

function ResizeSandbox(_props: {}, scope: Scope) {
	const size = reactive({ width: 0, height: 0 })

	// Define mixin on scope: resize(target, value, scope)
	scope.resize = (target: Node | Node[], value: any, _scope: Record<PropertyKey, any>) => {
		const element = Array.isArray(target) ? target[0] : target
		if (!(element instanceof HTMLElement)) return
		const observer = new ResizeObserver((entries) => {
			const rect = entries[0].contentRect
			const width = Math.round(rect.width)
			const height = Math.round(rect.height)
			if (isFunction(value)) {
				// Support two shapes:
				// - callback: (w, h) => void
				// - getter: () => { width, height }
				if (value.length >= 2) value(width, height)
				else {
					const next = value()
					if (next && typeof next === 'object') {
						next.width = width
						next.height = height
					}
				}
			} else if (value && typeof value === 'object') {
				value.width = width
				value.height = height
			}
		})
		observer.observe(element)
		return () => observer.disconnect()
	}

	return (
		<>
			<h3>Resize Sandbox</h3>
			<div
				style="resize: both; overflow: auto; border: 1px solid #ccc; padding: 8px; min-width: 120px; min-height: 80px;"
				use:resize={size}
			>
				Resize me
				<div style="margin-top: 8px; color: #555;">
					{size.width} × {size.height}
				</div>
			</div>
		</>
	)
}

const state = reactive({
	list: [] as string[],
})
// Add components using PascalCase JSX with children
const App = () => (
	<>
		<div>
			List: <span>{state.list.join(', ')}</span>
		</div>
		<MiniCounter list={state.list} />
		<ResizeSandbox />
	</>
)
/*
const microState = reactive({count: 0})
const MicroApp = () => (
	<>
		<div>
			Count: <span>{microState.count}</span>
		</div>
		<button onClick={() => microState.count++}>Increment</button>
	</>
)*/

// Initialize the app using the automated bindApp helper
export function initMini() {
	bindApp(<App />, '#mini')
}

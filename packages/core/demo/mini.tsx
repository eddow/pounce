import { type Env, latch } from '@pounce/core'
import { reactive } from 'mutts'
import { MiniCounter } from './components/MiniCounter'

function isFunction(value: any): value is Function {
	return typeof value === 'function'
}

type ResizeValue = { width: number; height: number } | ((w: number, h: number) => void)

function resize(target: Node | Node[], value: ResizeValue, _env: Env) {
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

			value(width, height)
		} else if (value && typeof value === 'object') {
			value.width = width
			value.height = height
		}
	})
	observer.observe(element)
	return () => observer.disconnect()
}

function ResizeSandbox(_props: {}, env: Env) {
	const size = reactive({ width: 0, height: 0 })

	// Define mixin on env: resize(target, value, env)
	env.resize = resize

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

// Initialize the app using the automated latch helper
latch('#mini', <App />)

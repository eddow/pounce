import { reactive } from 'mutts'

export default function SvgTests() {
	const state = reactive({
		radius: 20,
		color: 'red'
	})

	const Svg = 'svg' as any
	const Circle = 'circle' as any

	return (
		<div>
			<h1>SVG Tests</h1>
			<div class="controls">
				<button data-action="grow" onClick={() => state.radius += 5}>Grow</button>
				<button data-action="color-blue" onClick={() => state.color = 'blue'}>Blue</button>
			</div>
			<Svg width="200" height="200" data-testid="svg-root">
				<Circle
					cx="100"
					cy="100"
					r={state.radius}
					fill={state.color}
					data-testid="svg-circle"
				/>
			</Svg>
			<p>Radius: <span data-testid="radius-display">{state.radius}</span></p>
			<p>Color: <span data-testid="color-display">{state.color}</span></p>
		</div>
	)
}

import { progressModel } from '@pounce/ui'
import { effect, reactive } from 'mutts'

export default function ProgressDemo() {
	const state = reactive({
		progress: 0,
	})

	effect(() => {
		const interval = setInterval(() => {
			state.progress = (state.progress + 1) % 101
		}, 100)
		return () => clearInterval(interval)
	})

	const model = progressModel({
		get value() {
			return state.progress
		},
	})

	const indeterminateModel = progressModel({
		value: undefined,
	})

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;">
			<h2>Progress Primitive Demo</h2>

			<div style="margin-bottom: 24px;">
				<div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #94a3b8;">
					<span>Downloading Assets...</span>
					<span>{state.progress}%</span>
				</div>
				<div style="height: 8px; background: #334155; border-radius: 4px; overflow: hidden; position: relative;">
					<div
						style={`height: 100%; background: #3b82f6; width: ${state.progress}%; transition: width 0.1s linear;`}
					/>
					{/* Native fallback representation */}
					<progress {...model.progress} style="position: absolute; opacity: 0; inset: 0;" />
				</div>
			</div>

			<div>
				<div style="margin-bottom: 8px; font-size: 14px; color: #94a3b8;">Indeterminate State</div>
				<progress {...indeterminateModel.progress} style="width: 100%;" />
			</div>
		</div>
	)
}

import { radioButtonModel } from '@pounce/ui'
import { reactive } from 'mutts'

export default function RadioButtonDemo() {
	const state = reactive({
		theme: 'system',
	})

	const themes = [
		{ id: 'light', label: 'Light', icon: 'sun' },
		{ id: 'dark', label: 'Dark', icon: 'moon' },
		{ id: 'system', label: 'System', icon: 'monitor' },
	]

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;">
			<h2>RadioButton Primitive Demo</h2>
			<div style="display: flex; gap: 4px; background: #334155; padding: 4px; border-radius: 8px; align-self: flex-start;">
				<for each={themes}>
					{(t) => {
						const model = radioButtonModel({
							value: t.id,
							get group() {
								return state.theme
							},
							onClick: () => (state.theme = t.id as any),
						})
						return (
							<button
								style={`padding: 8px 16px; border-radius: 6px; border: none; background: ${state.theme === t.id ? '#3b82f6' : 'transparent'}; color: white; cursor: pointer; font-weight: 500; transition: all 0.2s;`}
								{...model.button}
							>
								{t.label}
							</button>
						)
					}}
				</for>
			</div>
			<p style="margin-top: 16px; color: #94a3b8;">
				Active theme: <span style="color: white; font-weight: bold;">{state.theme}</span>
			</p>
		</div>
	)
}

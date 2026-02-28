import { checkButtonModel } from '@pounce/ui'
import { reactive } from 'mutts'

export default function CheckButtonDemo() {
	const state = reactive({
		wifi: true,
		bluetooth: false,
		notifications: true,
		disabled: false,
	})

	const wifiModel = checkButtonModel({
		get checked() {
			return state.wifi
		},
		onCheckedChange: (v: boolean) => (state.wifi = v),
		icon: 'wifi',
		children: 'Wi-Fi',
	})

	const btModel = checkButtonModel({
		get checked() {
			return state.bluetooth
		},
		onCheckedChange: (v: boolean) => (state.bluetooth = v),
		icon: 'bluetooth',
		children: 'Bluetooth',
	})

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;">
			<h2>CheckButton Primitive Demo</h2>
			<div style="display: flex; gap: 12px; flex-wrap: wrap;">
				<button
					style={`padding: 12px 20px; border-radius: 8px; border: 2px solid ${state.wifi ? '#3b82f6' : '#475569'}; background: ${state.wifi ? '#1e40af' : '#334155'}; color: white; cursor: pointer; transition: all 0.2s;`}
					{...wifiModel.button}
				>
					{wifiModel.icon && <span {...wifiModel.icon.span}>{wifiModel.icon.element}</span>}
					Wi-Fi: {state.wifi ? 'On' : 'Off'}
				</button>

				<button
					style={`padding: 12px 20px; border-radius: 8px; border: 2px solid ${state.bluetooth ? '#3b82f6' : '#475569'}; background: ${state.bluetooth ? '#1e40af' : '#334155'}; color: white; cursor: pointer; transition: all 0.2s;`}
					{...btModel.button}
				>
					{btModel.icon && <span {...btModel.icon.span}>{btModel.icon.element}</span>}
					Bluetooth: {state.bluetooth ? 'On' : 'Off'}
				</button>
			</div>
		</div>
	)
}

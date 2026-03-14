import { checkButtonModel } from '@sursaut/ui'
import { reactive } from 'mutts'

export default function CheckButtonDemo() {
	const state = reactive({
		wifi: true,
		bluetooth: false,
	})

	const wifiModel = checkButtonModel({
		get checked() {
			return state.wifi
		},
		set checked(v) {
			if (typeof v === 'boolean') state.wifi = v
		},
		onCheckedChange: (v: boolean) => (state.wifi = v),
		icon: 'wifi',
		children: 'Wi-Fi',
	})

	const btModel = checkButtonModel({
		get checked() {
			return state.bluetooth
		},
		set checked(v) {
			if (typeof v === 'boolean') state.bluetooth = v
		},
		onCheckedChange: (v: boolean) => (state.bluetooth = v),
		icon: 'bluetooth',
		children: 'Bluetooth',
	})

	return (
		<div
			data-test="checkbutton-demo"
			style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;"
		>
			<h2>CheckButton Primitive Demo</h2>
			<div style="display: flex; gap: 12px; flex-wrap: wrap;">
				<button
					data-test="wifi-toggle"
					style={`padding: 12px 20px; border-radius: 8px; border: 2px solid ${state.wifi ? '#3b82f6' : '#475569'}; background: ${state.wifi ? '#1e40af' : '#334155'}; color: white; cursor: pointer; transition: all 0.2s;`}
					{...wifiModel.button}
				>
					{wifiModel.icon && <span {...wifiModel.icon.span}>{wifiModel.icon.element}</span>}
					Wi-Fi: {state.wifi ? 'On' : 'Off'}
				</button>

				<button
					data-test="bluetooth-toggle"
					style={`padding: 12px 20px; border-radius: 8px; border: 2px solid ${state.bluetooth ? '#3b82f6' : '#475569'}; background: ${state.bluetooth ? '#1e40af' : '#334155'}; color: white; cursor: pointer; transition: all 0.2s;`}
					{...btModel.button}
				>
					{btModel.icon && <span {...btModel.icon.span}>{btModel.icon.element}</span>}
					Bluetooth: {state.bluetooth ? 'On' : 'Off'}
				</button>
			</div>
			<p style="margin-top: 12px; color: #94a3b8;">
				Wi-Fi: <strong data-test="wifi-state">{state.wifi ? 'on' : 'off'}</strong>
				{' · '}
				Bluetooth: <strong data-test="bluetooth-state">{state.bluetooth ? 'on' : 'off'}</strong>
			</p>
		</div>
	)
}

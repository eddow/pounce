import {
	buttonModel,
	checkButtonModel,
	checkboxModel,
	radioButtonModel,
	radioModel,
	selectModel,
} from '@sursaut/ui'
import { reactive } from 'mutts'

const colors = ['red', 'green', 'blue']

export default function FormDemo() {
	const state = reactive({
		// Button
		clicks: 0,
		disabled: false,
		// CheckButton
		wifi: true,
		notifications: false,
		// Checkboxes: group with master/indeterminate
		toppings: [] as string[],
		// Radio + Select share the same value
		color: 'red' as string,
	})

	const allToppings = ['cheese', 'pepperoni', 'mushrooms']

	// Master checkbox: indeterminate when some (not all) toppings selected
	const masterModel = checkboxModel({
		get checked() {
			return state.toppings.length === allToppings.length ? true
				: state.toppings.length === 0 ? false
				: undefined // indeterminate
		},
		onChange(checked) {
			if (checked) state.toppings = [...allToppings]
			else state.toppings.splice(0)
		},
	})

	// Button model
	const btn = buttonModel({
		get disabled() { return state.disabled },
		onClick: () => { state.clicks++ },
	})

	// Select model for color — shares state.color with radio group
	const colorSelect = selectModel({
		get value() { return state.color },
		options: colors.map((v) => ({ value: v, label: v })),
		onInput: (v) => (state.color = v),
	})

	const wifiModel = checkButtonModel({
		get checked() {
			return state.wifi
		},
		set checked(v) {
			if (typeof v === 'boolean') state.wifi = v
		},
		onCheckedChange: (v) => (state.wifi = v),
		children: 'Wi-Fi',
	})

	const notificationsModel = checkButtonModel({
		get checked() {
			return state.notifications
		},
		set checked(v) {
			if (typeof v === 'boolean') state.notifications = v
		},
		onCheckedChange: (v) => (state.notifications = v),
		children: 'Notifications',
	})

	return (
		<div data-test="form-demo" style="padding: 20px;">
			<h2>Form Demo</h2>
			<p style="color: #94a3b8; margin-bottom: 24px;">
				Each input type, its capabilities, and how they interact.
			</p>

			{/* ── Button ─────────────────────────────────────── */}
			<section style="margin-bottom: 24px;">
				<h3>Button</h3>
				<div style="display: flex; gap: 12px; align-items: center;">
					<button
						data-test="btn"
						style={`padding: 8px 16px; border: none; border-radius: 4px; background: #3b82f6; color: white; cursor: ${state.disabled ? 'not-allowed' : 'pointer'}; opacity: ${state.disabled ? 0.5 : 1};`}
						{...btn.button}
					>
						Click me
					</button>
					<button data-test="btn-toggle" onClick={() => (state.disabled = !state.disabled)}>
						{state.disabled ? 'Enable' : 'Disable'}
					</button>
					<span data-test="btn-count">Clicks: {state.clicks}</span>
				</div>
			</section>

			{/* ── CheckButton (button-as-checkbox) ───────────── */}
			<section style="margin-bottom: 24px;">
				<h3>CheckButton</h3>
				<div style="display: flex; gap: 8px; flex-wrap: wrap;">
					<button
						data-test="checkbtn-wifi"
						style={`padding: 8px 12px; border-radius: 8px; border: 2px solid ${state.wifi ? '#3b82f6' : '#475569'}; background: ${state.wifi ? '#1e40af' : '#334155'}; color: white; cursor: pointer;`}
						{...wifiModel.button}
					>
						Wi-Fi
					</button>
					<button
						data-test="checkbtn-notifications"
						style={`padding: 8px 12px; border-radius: 8px; border: 2px solid ${state.notifications ? '#3b82f6' : '#475569'}; background: ${state.notifications ? '#1e40af' : '#334155'}; color: white; cursor: pointer;`}
						{...notificationsModel.button}
					>
						Notifications
					</button>
				</div>
				<p style="font-size: 14px; color: #94a3b8; margin-top: 8px;">
					Wi-Fi: <span data-test="s-wifi">{state.wifi ? 'on' : 'off'}</span> · Notifications:{' '}
					<span data-test="s-notifications">{state.notifications ? 'on' : 'off'}</span>
				</p>
			</section>

			{/* ── Checkboxes with master/indeterminate ────────── */}
			<section style="margin-bottom: 24px;">
				<h3>Checkboxes</h3>
				<label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: bold; margin-bottom: 8px;">
					<input data-test="master" {...masterModel.input} />
					All toppings
				</label>
				<div data-test="toppings-group" role="group" aria-label="Pizza toppings" style="display: flex; flex-direction: column; gap: 6px; padding-left: 24px;">
					<for each={allToppings}>
						{(t) => {
							const model = checkboxModel({
								get checked() { return state.toppings.includes(t) },
								onChange(checked) {
									if (checked) state.toppings.push(t)
									else {
										const i = state.toppings.indexOf(t)
										if (i > -1) state.toppings.splice(i, 1)
									}
								},
							})
							return (
								<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
									<input data-test={`topping-${t}`} {...model.input} />
									{t}
								</label>
							)
						}}
					</for>
				</div>
				<p data-test="toppings-status" style="font-size: 14px; color: #94a3b8; margin-top: 8px;">
					{state.toppings.length}/{allToppings.length} selected
				</p>
			</section>

			{/* ── RadioButton + input radio + Select share color ─ */}
			<section style="margin-bottom: 24px;">
				<h3>
					Color{' '}
					<small style="color: #94a3b8;">(radio button, input radio and select share the same value)</small>
				</h3>
				<div data-test="color-radiogroup" role="radiogroup" aria-label="Theme color" style="display: flex; gap: 4px; background: #334155; padding: 4px; border-radius: 8px; margin-bottom: 12px;">
					<for each={colors}>
						{(color) => {
							const model = radioButtonModel({
								value: color,
								get group() { return state.color },
								onClick: () => (state.color = color),
							})
							return (
								<button
									data-test={`radio-${color}`}
									style={`padding: 8px 16px; border-radius: 6px; border: none; background: ${state.color === color ? '#3b82f6' : 'transparent'}; color: white; cursor: pointer;`}
									{...model.button}
								>
									{color}
								</button>
							)
						}}
					</for>
				</div>
				<div style="display: flex; gap: 12px; margin-bottom: 12px;">
					<for each={colors}>
						{(color) => {
							const model = radioModel({
								name: 'color-input',
								value: color,
								get group() {
									return state.color
								},
								set group(v) {
									if (typeof v === 'string') state.color = v
								},
							})
							return (
								<label style="display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
									<input data-test={`input-radio-${color}`} {...model.input} />
									{color}
								</label>
							)
						}}
					</for>
				</div>
				<select data-test="color-select" style="padding: 8px; border-radius: 4px; background: #334155; color: white; border: 1px solid #475569;" {...colorSelect.select}>
					{colorSelect.options}
				</select>
				<div data-test="color-swatch" style={`margin-top: 12px; width: 40px; height: 40px; border-radius: 8px; background: ${state.color};`} />
			</section>

			{/* ── Live summary ────────────────────────────────── */}
			<section data-test="summary" style="padding: 15px; background: #0f172a; border-radius: 8px;">
				<h3>Live State</h3>
				<p>Clicks: <span data-test="s-clicks">{state.clicks}</span></p>
				<p>Toppings: <span data-test="s-toppings">{state.toppings.join(', ') || 'none'}</span></p>
				<p>Color: <span data-test="s-color">{state.color}</span></p>
			</section>
		</div>
	)
}

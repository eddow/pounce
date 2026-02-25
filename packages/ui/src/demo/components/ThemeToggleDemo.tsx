import { themeToggleModel } from '@pounce/ui'
import { reactive } from 'mutts'

export default function ThemeToggleDemo() {
	const vm = reactive({
		settings: { theme: 'auto' as any },
		resolved: 'dark',
		get model() {
			return themeToggleModel({
				settings: this.settings,
				resolvedTheme: this.resolved,
				labels: { light: 'Day Mode', dark: 'Night Mode' },
			})
		},
	})

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;">
			<h2>ThemeToggle Primitive Demo</h2>

			<div
				style="display: flex; align-items: center; gap: 12px; position: relative;"
				use={vm.model.clickOutside}
			>
				<button
					style="padding: 10px; background: #334155; border: 1px solid #475569; border-radius: 8px; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px;"
					{...vm.model.button}
				>
					{vm.resolved === 'dark' ? '🌙' : '☀️'}
					{vm.model.currentLabel}
				</button>

				<button
					style="padding: 10px; background: #334155; border: 1px solid #475569; border-radius: 8px; color: white; cursor: pointer;"
					{...vm.model.dropdownButton}
				>
					▾
				</button>

				{() =>
					vm.model.menuOpen && (
						<div style="position: absolute; top: 100%; right: 0; margin-top: 8px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 4px; min-width: 140px; z-index: 100; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);">
							<for each={vm.model.allThemes}>
								{(t) => (
									<button
										style={`width: 100%; text-align: left; padding: 8px 12px; background: ${vm.settings.theme === t ? '#3b82f6' : 'transparent'}; border: none; border-radius: 4px; color: white; cursor: pointer;`}
										{...vm.model.optionButton(t)}
									>
										{t === 'light' ? '☀️ Light' : '🌙 Dark'}
									</button>
								)}
							</for>
							<div style="height: 1px; background: #334155; margin: 4px 0;" />
							<button
								style={`width: 100%; text-align: left; padding: 8px 12px; background: ${vm.settings.theme === 'auto' ? '#3b82f6' : 'transparent'}; border: none; border-radius: 4px; color: white; cursor: pointer;`}
								{...vm.model.autoButton}
							>
								🖥️ Auto
							</button>
						</div>
					)
				}
			</div>

			<p style="margin-top: 16px; font-size: 14px; color: #94a3b8;">
				Setting: <code style="color: white;">{vm.settings.theme}</code>
				<br />
				Actually Rendering: <code style="color: white;">{vm.resolved}</code>
			</p>
		</div>
	)
}

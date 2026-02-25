import { reactive } from 'mutts'
import { themeToggleModel } from '@pounce/ui'

export default function ThemeToggleTests() {
	const vm = reactive({
		settings: { theme: 'auto' as 'auto' | 'light' | 'dark' },
		resolved: 'light',
		get model() {
			return themeToggleModel({
				settings: this.settings,
				resolvedTheme: this.resolved
			})
		}
	})

	return (
		<div>
			<h1>ThemeToggle Model Tests</h1>
			<p>Setting: <span data-testid="theme-setting">{vm.settings.theme}</span></p>
			<p>Resolved: <span data-testid="resolved-theme">{vm.resolved}</span></p>

			<button data-testid="toggle-btn" {...vm.model.button}>Toggle</button>
			<button data-testid="dropdown-btn" {...vm.model.dropdownButton}>Menu</button>

			{() => vm.model.menuOpen && (
				<div data-testid="theme-menu" use={vm.model.clickOutside}>
					<button data-testid="opt-light" {...vm.model.optionButton('light')}>Light</button>
					<button data-testid="opt-dark" {...vm.model.optionButton('dark')}>Dark</button>
					<button data-testid="opt-auto" {...vm.model.autoButton}>Auto</button>
				</div>
			)}
		</div>
	)
}

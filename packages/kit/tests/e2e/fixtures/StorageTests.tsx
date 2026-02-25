import { stored } from '../../../src/dom/storage'

export default function StorageTests() {
	const prefs = stored({ theme: 'light', count: 0 })

	return (
		<div data-testid="storage-view">
			<h1>Storage Tests</h1>
			<div class="controls">
				<button data-action="toggle-theme" onClick={() => prefs.theme = prefs.theme === 'light' ? 'dark' : 'light'}>
					Toggle Theme
				</button>
				<button data-action="inc-count" onClick={() => prefs.count++}>
					Inc Count
				</button>
				<button data-action="clear-storage" onClick={() => {
					localStorage.clear()
					// We might need a way to force refresh the stored() object if it doesn't watch storage events for its own key clearing
					// But usually, length=0 triggers change.
				}}>
					Clear LocalStorage
				</button>
			</div>
			<div id="status">
				<p>Theme: <span data-testid="storage-theme">{prefs.theme}</span></p>
				<p>Count: <span data-testid="storage-count">{prefs.count}</span></p>
			</div>
		</div>
	)
}

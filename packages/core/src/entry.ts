import { initTests } from '../tests/e2e/fixtures/main'
import './demo/main'
import './demo/mini'

/**
 * Entry point that determines whether to load the main demos
 * or the E2E test fixture router.
 */
function entry() {
	const hash = window.location.hash.slice(1)

	// Test fixtures start with uppercase letter (e.g., Binding, Dynamic, For, etc.)
	if (hash && /^[A-Z]/.test(hash)) {
		console.log('[pounce] Entry: Loading test fixtures')
		initTests()
	}
	// Main demo mounts by default (already imported via side effects)
}

// Use microtask to ensure all modules are fully evaluated before starting
Promise.resolve().then(entry)

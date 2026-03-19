import { initDemo } from '../demo/main'
import { initMini } from '../demo/mini'
import { initTests } from '../tests/e2e/fixtures/main'

/**
 * Entry point that determines whether to load the main demos
 * or the E2E test fixture router.
 */
function entry() {
	const hash = window.location.hash.slice(1)

	// Test fixtures start with uppercase letter (e.g., Binding, Dynamic, For, etc.)
	if (hash && /^[A-Z]/.test(hash)) {
		console.log('[sursaut] Entry: Loading test fixtures')
		initTests()
		return
	}
	initMini()
	initDemo()
}

// Use microtask to ensure all modules are fully evaluated before starting
Promise.resolve().then(entry)

import { initTests } from '../tests/e2e/fixtures/main'
import './demo/main'
import './demo/mini'

/**
 * Entry point that determines whether to load the main demos
 * or the E2E test fixture router.
 */
function entry() {
	const hash = window.location.hash.slice(1)

	// If there's a hash, we assume it's a test fixture route.
	// Test fixtures usually start with an uppercase letter or are specific names.
	if (hash && hash !== 'mini' && hash !== 'app') {
		console.log('[pounce] Entry: Loading test fixtures')
		initTests()
	}
}

// Use microtask to ensure all modules are fully evaluated before starting
Promise.resolve().then(entry)

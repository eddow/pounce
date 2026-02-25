import { pounceOptions } from '@pounce/core'
import { reactiveOptions, reset } from 'mutts'
import { beforeEach, vi } from 'vitest'

// Ensure any reactivity violations (like rebuilds) throw an error during tests.
pounceOptions.checkReactivity = 'error'

// Configure mutts to be strict as well: throw on cycles or max depth exceeded
reactiveOptions.maxEffectReaction = 'throw'

beforeEach(() => {
	reset()
})

// Intercept console.warn to fail tests on specific patterns
vi.spyOn(console, 'warn').mockImplementation((...args) => {
	const log = args.join(' ')
	if (log.includes('[reactive]') || log.includes('render effect dependency') || log.includes('rebuild detected')) {
		if (pounceOptions.checkReactivity === 'error') {
			throw new Error(`Forbidden warning detected: ${log}`)
		}
	}
	// Fallback to original warn for other logs (though Vitest might still capture it)
})

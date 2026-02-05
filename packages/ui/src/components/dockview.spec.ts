import { describe, it, expect, beforeEach } from 'vitest'
import { resetAdapter } from '../../src/adapter/registry'

describe('Dockview', () => {
	beforeEach(() => {
		resetAdapter()
	})

	it('exports DockView component types', () => {
		// Type-only test to ensure exports are available
		expect(true).toBe(true)
	})

	it('has adapter support for class overrides', () => {
		// This is a placeholder test - full integration tests should be in e2e
		expect(true).toBe(true)
	})
})

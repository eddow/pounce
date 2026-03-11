import { describe, expect, it } from 'vitest'
import * as dockview from './dockview'
import * as ui from './index'

describe('entrypoints', () => {
	it('does not expose Dockview exports from the root entry', () => {
		expect('Dockview' in ui).toBe(false)
		expect('DockviewRouter' in ui).toBe(false)
	})

	it('exposes Dockview exports from the dockview subpath entry', () => {
		expect(dockview.Dockview).toBeDefined()
		expect(dockview.DockviewRouter).toBeDefined()
	})
})

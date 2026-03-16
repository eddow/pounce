import { reactive } from 'mutts'
import { describe, expect, it } from 'vitest'
import type { ArrangedProps } from './types'
import { arranged } from './utils'

describe('arranged', () => {
	it('resolves inherited values and prop overrides lazily', () => {
		const scope = {
			arranged: reactive({
				orientation: 'vertical' as 'horizontal' | 'vertical',
				density: 'compact' as 'regular' | 'compact',
				joined: true,
				align: 'stretch' as 'start' | 'center' | 'stretch',
			}),
		}
		const props = reactive<ArrangedProps>({})
		const value = arranged(scope, props)

		expect(value.orientation).toBe('vertical')
		expect(value.density).toBe('compact')
		expect(value.joined).toBe(true)
		expect(value.align).toBe('stretch')
		expect(value.class).toEqual([
			'orientation-vertical',
			'density-compact',
			'joined-true',
			'align-stretch',
		])

		scope.arranged.orientation = 'horizontal'
		props.density = 'regular'
		props.joined = false

		expect(value.orientation).toBe('horizontal')
		expect(value.density).toBe('regular')
		expect(value.joined).toBe(false)
		expect(value.class).toEqual([
			'orientation-horizontal',
			'density-regular',
			'joined-false',
			'align-stretch',
		])
	})

	it('uses configurable class mappings', () => {
		const previous = arranged['orientation:horizontal']
		arranged['orientation:horizontal'] = 'adapter-horizontal'
		try {
			const value = arranged({}, {})
			expect(value.class).toEqual([
				'adapter-horizontal',
				'density-regular',
				'joined-false',
				'align-center',
			])
		} finally {
			arranged['orientation:horizontal'] = previous
		}
	})

	it('falls back to defaults when nothing is provided', () => {
		const value = arranged({}, {})

		expect(value.orientation).toBe('horizontal')
		expect(value.density).toBe('regular')
		expect(value.joined).toBe(false)
		expect(value.align).toBe('center')
		expect(value.class).toEqual([
			'orientation-horizontal',
			'density-regular',
			'joined-false',
			'align-center',
		])
	})
})

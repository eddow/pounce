import { effect, reactive, reset } from 'mutts'
import { afterEach, describe, expect, it } from 'vitest'
import { ReactiveProp, bind } from '@sursaut/core'

afterEach(() => reset())

function rp<T>(get: () => T, set: (value: T) => void) {
	return new ReactiveProp(get, set)
}

describe('bind() runtime', () => {
	it('syncs dst from src on mount', () => {
		const a = reactive({ x: 1 })
		const bv = reactive({ x: 0 })
		bind(rp(() => bv.x, (v) => { bv.x = v }), rp(() => a.x, (v) => { a.x = v }))
		expect(bv.x).toBe(1)
	})

	it('propagates src → dst on change', () => {
		const a = reactive({ x: 1 })
		const bv = reactive({ x: 0 })
		bind(rp(() => bv.x, (v) => { bv.x = v }), rp(() => a.x, (v) => { a.x = v }))
		a.x = 42
		expect(bv.x).toBe(42)
	})

	it('propagates dst → src on change', () => {
		const a = reactive({ x: 1 })
		const bv = reactive({ x: 0 })
		bind(rp(() => bv.x, (v) => { bv.x = v }), rp(() => a.x, (v) => { a.x = v }))
		bv.x = 99
		expect(a.x).toBe(99)
	})

	it('does not loop infinitely', () => {
		const a = reactive({ x: 0 })
		const bv = reactive({ x: 0 })
		let count = 0
		bind(rp(() => bv.x, (v) => { bv.x = v }), rp(() => a.x, (v) => { a.x = v }))
		effect`bind:test`(() => { void a.x; void bv.x; count++ })
		const before = count
		a.x = 1
		expect(count - before).toBeLessThanOrEqual(2)
	})

	it('applies default to src when src is undefined', () => {
		const a = reactive<{ x: number | undefined }>({ x: undefined })
		const bv = reactive<{ x: number | undefined }>({ x: 0 })
		bind(rp(() => bv.x, (v) => { bv.x = v }), rp(() => a.x, (v) => { a.x = v }), 7)
		expect(a.x).toBe(7)
		expect(bv.x).toBe(7)
	})

	it('does not override src when src already has a value', () => {
		const a = reactive<{ x: number | undefined }>({ x: 5 })
		const bv = reactive<{ x: number | undefined }>({ x: 0 })
		bind(rp(() => bv.x, (v) => { bv.x = v }), rp(() => a.x, (v) => { a.x = v }), 99)
		expect(a.x).toBe(5)
		expect(bv.x).toBe(5)
	})

	it('stop() tears down both effects', () => {
		const a = reactive({ x: 1 })
		const bv = reactive({ x: 0 })
		const stop = bind(rp(() => bv.x, (v) => { bv.x = v }), rp(() => a.x, (v) => { a.x = v }))
		stop()
		a.x = 42
		expect(bv.x).toBe(1)
	})
})

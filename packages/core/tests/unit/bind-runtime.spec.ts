import { effect, reactive, reset } from 'mutts'
import { afterEach, describe, expect, it } from 'vitest'
import { ReactiveProp, bind } from '@pounce/core'

afterEach(() => reset())

describe('bind: notation — runtime', () => {
	it('syncs dst from src on mount', () => {
		const a = reactive({ x: 1 })
		const bv = reactive({ x: 0 })
		bind: bv.x = a.x
		expect(bv.x).toBe(1)
	})

	it('propagates src → dst on change', () => {
		const a = reactive({ x: 1 })
		const bv = reactive({ x: 0 })
		bind: bv.x = a.x
		a.x = 42
		expect(bv.x).toBe(42)
	})

	it('propagates dst → src on change', () => {
		const a = reactive({ x: 1 })
		const bv = reactive({ x: 0 })
		bind: bv.x = a.x
		bv.x = 99
		expect(a.x).toBe(99)
	})

	it('does not loop infinitely', () => {
		const a = reactive({ x: 0 })
		const bv = reactive({ x: 0 })
		let count = 0
		bind: bv.x = a.x
		effect(() => { void a.x; void bv.x; count++ })
		const before = count
		a.x = 1
		expect(count - before).toBeLessThanOrEqual(2)
	})

	it('applies default to src when src is undefined', () => {
		const a = reactive<{ x: number | undefined }>({ x: undefined })
		const bv = reactive({ x: 0 })
		bind: bv.x = a.x ??= 7
		expect(a.x).toBe(7)
		expect(bv.x).toBe(7)
	})

	it('does not override src when src already has a value', () => {
		const a = reactive({ x: 5 })
		const bv = reactive({ x: 0 })
		bind: bv.x = a.x ??= 99
		expect(a.x).toBe(5)
		expect(bv.x).toBe(5)
	})

	it('stop() tears down both effects', () => {
		const a = reactive({ x: 1 })
		const bv = reactive({ x: 0 })
		const stop = bind(new ReactiveProp(() => bv.x, v => { bv.x = v }), new ReactiveProp(() => a.x, v => { a.x = v }))
		stop()
		a.x = 42
		expect(bv.x).toBe(1)
	})
})

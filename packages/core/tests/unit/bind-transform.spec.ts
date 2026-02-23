import { describe, it, expect } from 'vitest'
import { transformSync } from '@babel/core'
import { pounceBabelPlugin } from '../../src/plugin/babel'

function transform(code: string): string {
	const result = transformSync(code, {
		filename: 'test.tsx',
		plugins: [[pounceBabelPlugin]],
		parserOpts: { plugins: ['typescript'] },
		generatorOpts: { compact: true },
	})
	return result?.code ?? ''
}

describe('bind label transform', () => {
	it('transforms `bind: dst = src` into `b(r(dst), r(src))`', () => {
		const out = transform(`
			const a = reactive({ x: 1 })
			const b2 = reactive({ x: 0 })
			bind: b2.x = a.x
		`)
		expect(out).toContain('bind(r(')
		expect(out).not.toContain('bind:')
		// dst first, src second
		expect(out).toMatch(/bind\(r\(\(\)=>b2\.x,_v=>b2\.x=_v\),r\(\(\)=>a\.x,_v=>a\.x=_v\)\)/)
	})

	it('transforms `bind: dst = src ??= dft` into `b(r(dst), r(src), dft)`', () => {
		const out = transform(`
			const a = reactive({ x: undefined })
			const b2 = reactive({ x: 0 })
			bind: b2.x = a.x ??= 42
		`)
		expect(out).toContain('bind(r(')
		expect(out).toMatch(/bind\(r\(\(\)=>b2\.x,_v=>b2\.x=_v\),r\(\(\)=>a\.x,_v=>a\.x=_v\),42\)/)
	})

	it('auto-imports b and r from @pounce/core', () => {
		const out = transform(`
			const a = reactive({ x: 1 })
			let w = 0
			bind: w = a.x
		`)
		expect(out).toContain('from"@pounce/core"')
		expect(out).toMatch(/import\s*\{[^}]*\bbind\b[^}]*\}/)
		expect(out).toMatch(/import\s*\{[^}]*\br\b[^}]*\}/)
	})

	it('throws on non-assignable src', () => {
		expect(() => transform(`
			bind: something = 42
		`)).toThrow('[bind]')
	})
})

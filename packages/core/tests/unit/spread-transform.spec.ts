import { describe, it, expect } from 'vitest'
import { transformSync } from '@babel/core'
import babelPluginJsx from '@babel/plugin-transform-react-jsx'
import babelPluginTs from '@babel/plugin-transform-typescript'
import { pounceBabelPlugin, pounceSpreadPlugin } from '../../src/plugin/babel'

function transform(code: string): string {
	const result = transformSync(code, {
		filename: 'test.tsx',
		plugins: [
			[pounceBabelPlugin],
			[babelPluginJsx, { runtime: 'classic', pragma: 'h', pragmaFrag: 'Fragment', throwIfNamespace: false }],
			[pounceSpreadPlugin],
			[babelPluginTs, { isTSX: true, allowDeclareFields: true }],
		],
		generatorOpts: { compact: true },
	})
	return result?.code ?? ''
}

describe('spread attribute babel transform', () => {
	it('wraps single spread in c(() => x)', () => {
		const out = transform(`<Comp {...state.attrs} />`)
		expect(out).toContain('c(()=>state.attrs)')
		expect(out).not.toContain('_extends')
	})

	it('wraps spread with other attrs: mixed case via pounceSpreadPlugin', () => {
		const out = transform(`<Comp id="x" {...state.attrs} />`)
		expect(out).toContain('c({id:"x"},')
		expect(out).toContain('()=>state.attrs')
	})

	it('wraps spread of a plain identifier', () => {
		const out = transform(`<div {...props} />`)
		expect(out).toContain('c(()=>props)')
	})

	it('wraps spread of a call expression', () => {
		const out = transform(`<div {...getProps()} />`)
		expect(out).toContain('c(()=>getProps())')
	})

	it('auto-imports c from @pounce/core', () => {
		const out = transform(`<div {...state} />`)
		expect(out).toMatch(/import\s*\{[^}]*\bc\b[^}]*\}.*from"@pounce\/core"/)
	})

	it('wraps multiple spreads in a single c() with multiple arguments', () => {
		const out = transform(`<Comp value={state.count} {...counts[state.locale]} />`)
		// Should be: c({ value: r(() => state.count, val => state.count = val) }, () => counts[state.locale])
		expect(out).toMatch(/c\(\{[^}]*value[^}]*\},\(\)=>counts\[state\.locale\]\)/)
		expect(out).toContain('r(')
	})

	it('does not transform regular object spreads outside JSX', () => {
		const out = transform(`const merged = { ...a, ...b }`)
		expect(out).not.toContain('c(')
		expect(out).toContain('...a')
		expect(out).toContain('...b')
	})
})

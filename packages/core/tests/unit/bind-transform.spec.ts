import { describe, it, expect } from 'vitest'
import { transformSync } from '@babel/core'
import { sursautBabelPlugin } from '../../src/plugin/babel'

function transform(code: string): string {
	const result = transformSync(code, {
		filename: 'test.tsx',
		plugins: [[sursautBabelPlugin]],
		parserOpts: { plugins: ['typescript'] },
		generatorOpts: { compact: true },
	})
	return result?.code ?? ''
}

describe('bind label syntax', () => {
	it('throws with a migration hint', () => {
		expect(() => transform(`
			const a = reactive({ x: 1 })
			const b2 = reactive({ x: 0 })
			bind: b2.x = a.x
		`)).toThrow('use bind(...) directly')
	})
})

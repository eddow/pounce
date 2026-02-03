import { transformSync } from '@babel/core'
import { describe, expect, it } from 'vitest'
import { pounceBabelPlugin } from '../src/core/index'

describe('pounceBabelPlugin', () => {
	it('replaces Object.assign in h() props with compose and injects utils imports', () => {
		const source = "const el = h('div', Object.assign({ a: 1 }, { b: 2 }))"
		const result = transformSync(source, {
			filename: '/proj/src/components/test.tsx',
			babelrc: false,
			configFile: false,
			plugins: [[pounceBabelPlugin, { projectRoot: '/proj' }]],
		})

		expect(result?.code).toContain('compose(')
		expect(result?.code).not.toContain('Object.assign')
		expect(result?.code).toContain('@pounce/core')
		expect(result?.code).toContain('forwardProps')
	})
})

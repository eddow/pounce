import { describe, it, expect } from 'vitest'
import { withSSR } from '../../src/lib/server'

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

describe('SSR isolation', () => {
	it('should isolate platform bindings across concurrent withSSR calls', async () => {
		const [a, b] = await Promise.all([
			withSSR(async ({ document }) => {
				const root = document.getElementById('root')
				expect(root).toBeTruthy()
				root?.setAttribute('data-test', 'a')
				await delay(10)
				return root?.getAttribute('data-test')
			}),
			withSSR(async ({ document }) => {
				const root = document.getElementById('root')
				expect(root).toBeTruthy()
				root?.setAttribute('data-test', 'b')
				await delay(5)
				return root?.getAttribute('data-test')
			}),
		])

		expect(a).toBe('a')
		expect(b).toBe('b')
	})
})

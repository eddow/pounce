import { c, h, rootEnv } from '@pounce/core'
import { reactive } from 'mutts'
import { describe, expect, it } from 'vitest'

describe('Directive layering semantics', () => {
	it('accumulates bare use callbacks across layers', () => {
		const calls: string[] = []
		const firstUse = () => {
			calls.push('first')
			return () => {}
		}
		const secondUse = () => {
			calls.push('second')
			return () => {}
		}

		h('div', c({ use: firstUse }, { use: secondUse })).render(rootEnv)

		expect(calls).toEqual(['first', 'second'])
	})

	it('accumulates this callbacks across layers', () => {
		const calls: Node[] = []
		const firstRef = (node: Node | readonly Node[]) => {
			calls.push(Array.isArray(node) ? node[0] : node)
		}
		const secondRef = (node: Node | readonly Node[]) => {
			calls.push(Array.isArray(node) ? node[0] : node)
		}

		const node = h('div', c({ this: firstRef }, { this: secondRef })).render(rootEnv)[0]

		expect(calls).toHaveLength(2)
		expect(calls[0]).toBe(node)
		expect(calls[1]).toBe(node)
	})

	it('overrides use:name by directive name (last layer wins)', () => {
		const args: unknown[] = []
		const env = Object.create(rootEnv) as Record<string, unknown>
		env.resize = (_target: Node | readonly Node[], value: unknown) => {
			args.push(value)
			return () => {}
		}

		h('div', c({ 'use:resize': 'first' }, { 'use:resize': 'second' })).render(env)

		expect(args).toEqual(['second'])
	})

	it('accepts use:name from reactive spread-like layers', () => {
		const args: unknown[] = []
		const layer = reactive({ 'use:resize': 'from-reactive-layer' })
		const env = Object.create(rootEnv) as Record<string, unknown>
		env.resize = (_target: Node | readonly Node[], value: unknown) => {
			args.push(value)
			return () => {}
		}

		h('div', c(layer)).render(env)

		expect(args).toEqual(['from-reactive-layer'])
	})
})

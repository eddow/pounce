import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { atomic } from 'mutts'
import { document, latch } from '@sursaut/core'
import { reconcile } from '../../src/lib/reconciler'

describe('node reuse and destruction semantics', () => {
	let container: HTMLElement
	let stop: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
	})

	afterEach(() => {
		stop?.()
		stop = undefined
		container.remove()
	})

	it('allows same-batch rescue during reconciliation', () => {
		const node = document.createElement('span')
		node.textContent = 'kept'
		container.appendChild(node)

		expect(() => {
			atomic(() => {
				reconcile(container, [])
				reconcile(container, node)
			})()
		}).not.toThrow()

		expect(container.firstChild).toBe(node)
		expect(container.childNodes).toHaveLength(1)
	})

	it('throws when reusing a node after latch cleanup destroyed it', () => {
		const node = document.createElement('span')
		node.textContent = 'destroyed'

		stop = latch(container, node)
		expect(container.firstChild).toBe(node)

		stop()
		stop = undefined
		expect(container.childNodes).toHaveLength(0)

		expect(() => {
			const relatchStop = latch(container, node)
			relatchStop()
		}).toThrow('[sursaut] Cannot re-add a node that has already been unlinked')
	})
})

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { h, latch, document, rootEnv, extend, ReactiveProp } from '@pounce/core'

describe('Diagnostic: Core Refactoring Failures', () => {
	let container: HTMLElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		container.remove()
	})

	it('BUG 1: extend() fails on hierarchical props proxies', () => {
		const defaults = { text: 'default' }
		// Simulate a proxy that has properties but they are not "own" properties of the target
		const props = new Proxy({} as any, {
			get: (_, prop) => prop === 'text' ? 'custom' : undefined,
			ownKeys: () => ['text'],
			getOwnPropertyDescriptor: (_, prop) => prop === 'text' ? { enumerable: true, configurable: true } : undefined
		})

		const state = extend(defaults, props)
		// EXPECTATION: state.text should be 'custom'
		expect(state.text).toBe('custom')
	})

	it('BUG 2: pounceElement creates [object Object] for ReactiveProp', () => {
		const prop = new ReactiveProp(() => 'hello')
		const _el = latch(container, <div>{prop as any}</div>)

		// EXPECTATION: text should be 'hello'
		// REALITY: it's "[object Object]" because pounceElement doesn't collapse it
		expect(container.textContent).toBe('hello')
	})

	it('BUG 3: myFlat leaks ReactiveProp into Node array', () => {
		const prop = new ReactiveProp(() => document.createTextNode('inner'))
		// Comp returns a ReactiveProp (as if it was a lifted result)
		function Comp() { return prop as any }

		const mount = <div><Comp /></div>
		const nodes = mount.render(rootEnv) as HTMLElement

		// If it worked, the child should be the text node
		// If myFlat failed, the reconciler might have gotten the ReactiveProp
		expect(nodes.childNodes[0]).toBeInstanceOf(Node)
		expect(nodes.childNodes[0].nodeType).toBe(Node.TEXT_NODE)
		expect(nodes.textContent).toBe('inner')
	})
})

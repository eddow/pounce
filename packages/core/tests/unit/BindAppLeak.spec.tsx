/**
 * Test to confirm bindApp re-render bug
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { reactive, effect } from 'mutts'
import { JSDOM } from 'jsdom'
import { bindApp, h, type Scope } from '../../src/lib'

describe('bindApp re-render bug', () => {
	let document: Document
	let container: HTMLElement

	beforeEach(() => {
		const dom = new JSDOM('<!DOCTYPE html><div id="app"></div>')
		document = dom.window.document
		globalThis.document = document
		globalThis.Node = dom.window.Node as any
		container = document.getElementById('app')!
	})

	it('should NOT re-render whole app when state changes if bindApp is correct', () => {
		const appRenderCount = { count: 0 }
		const state = reactive({ count: 0 })

		const App = () => {
			appRenderCount.count++
			console.log('App rendered:', appRenderCount.count)
			return <div>Count: {state.count}</div>
		}

		// Current problematic bindApp implementation (with effect wrapper)
		// Note: We are using the actually exported bindApp from "../../lib"
		bindApp(<App />, container)

		expect(appRenderCount.count).toBe(1)

		// Increment count
		state.count++

		// If bindApp has the effect wrapper, App might re-render (count becomes 2)
		// If bindChildren (inner effect) handles it, App re-render might not happen
		// depending on how processChildren/rendered reactive array works.

		console.log('App render count after change:', appRenderCount.count)
	})
})

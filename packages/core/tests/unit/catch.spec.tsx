import { beforeEach, describe, expect, it } from 'vitest'
import { h, latch } from '../../src'
import { effect, reactive } from 'mutts'

describe('<catch> meta attribute', () => {
	let container: HTMLElement

	beforeEach(() => {
		container = document.createElement('div')
	})

	it('renders normal content when no error occurs', () => {
		const NormalRender = () => <span>Success</span>
		const el = (
			<try catch={(error: unknown) => <span>Error Caught: {String(error)}</span>}>
				<NormalRender />
			</try>
		)
		container.replaceChildren(...el.render())
		expect(container.textContent).toBe('Success')
	})

	it('renders fallback content when child throws during render', () => {
		const FailingRender = () => {
			throw new Error('Boom!')
		}

		const el = (
			<try catch={(error: unknown) => <span class="fallback">Error Caught: {(error as Error).message}</span>}>
				<FailingRender />
			</try>
		)

		latch(container, el)
		expect(container.innerHTML).toContain('<span class="fallback">Error Caught: Boom!</span>')
	})

	it('updates cleanly when a reactive prop causes a failure after mount', async () => {
		const state = reactive({ fail: false })

		const ReactiveFailure = () => {
			effect(() => { if (state.fail) throw new Error('Delayed Blast!') })
			return <span>Everything is fine</span>
		}

		const el = (
			<try catch={(error: unknown) => <span class="recovered">{(error as Error).message}</span>}>
				<ReactiveFailure />
			</try>
		)

		latch(container, el)
		expect(container.textContent).toBe('Everything is fine')

		// Trigger failure
		state.fail = true

		// Fallback should have replaced the broken content inside the same div
		expect(container.innerHTML).toContain('<span class="recovered">Delayed Blast!</span>')
		expect(container.textContent).toBe('Delayed Blast!')
	})

	it('bubbles error to parent catch if local component has no catch', () => {
		const GrandChild = () => {
			throw new Error('Deep fail')
			return <span>Deep</span>
		}

		const Child = () => {
			return <div><GrandChild /></div>
		}

		const el = (
			<try catch={(error: unknown) => <b class="error">{(error as Error).message}</b>}>
				<Child />
			</try>
		)
		latch(container, el)
		expect(container.innerHTML).toContain('<b class="error">Deep fail</b>')
	})
})

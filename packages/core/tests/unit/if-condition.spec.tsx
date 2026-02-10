import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { reactive } from 'mutts'

describe('if={condition} on intrinsic elements', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
	})

	it('hides element when condition is false', () => {
		const state = reactive({ show: false })
		unmount = bindApp(
			<div>
				<span if={state.show} class="target">visible</span>
			</div>,
			container
		)
		expect(container.querySelector('.target')).toBeNull()
	})

	it('shows element when condition is true', () => {
		const state = reactive({ show: true })
		unmount = bindApp(
			<div>
				<span if={state.show} class="target">visible</span>
			</div>,
			container
		)
		expect(container.querySelector('.target')).not.toBeNull()
	})

	it('reactively shows/hides element when condition changes', () => {
		const state = reactive({ show: false })
		unmount = bindApp(
			<div>
				<span if={state.show} class="target">visible</span>
			</div>,
			container
		)
		expect(container.querySelector('.target')).toBeNull()
		state.show = true
		expect(container.querySelector('.target')).not.toBeNull()
		state.show = false
		expect(container.querySelector('.target')).toBeNull()
	})

	it('works with a function call that reads reactive state', () => {
		const stack = reactive<{ mode: string }[]>([])
		const hasBackdrop = () => stack.some(e => e.mode === 'modal')

		unmount = bindApp(
			<div>
				<div if={hasBackdrop()} class="backdrop">backdrop</div>
			</div>,
			container
		)
		expect(container.querySelector('.backdrop')).toBeNull()
		stack.push({ mode: 'modal' })
		expect(container.querySelector('.backdrop')).not.toBeNull()
		stack.splice(0, 1)
		expect(container.querySelector('.backdrop')).toBeNull()
	})

	it('works with if/else pair', () => {
		const state = reactive({ show: true })
		unmount = bindApp(
			<div>
				<span if={state.show} class="yes">yes</span>
				<span else class="no">no</span>
			</div>,
			container
		)
		expect(container.querySelector('.yes')).not.toBeNull()
		expect(container.querySelector('.no')).toBeNull()
		state.show = false
		expect(container.querySelector('.yes')).toBeNull()
		expect(container.querySelector('.no')).not.toBeNull()
	})

	it('works inside <fragment> wrapper (WithOverlays pattern)', () => {
		const stack = reactive<{ mode: string }[]>([])
		const hasBackdrop = () => stack.some(e => e.mode === 'modal')

		unmount = bindApp(
			<fragment>
				<div>children</div>
				<div class="overlay-manager">
					<div
						if={hasBackdrop()}
						class="backdrop"
						aria-hidden="true"
					/>
					<div class="layer">layers</div>
				</div>
			</fragment>,
			container
		)
		expect(container.querySelector('.backdrop')).toBeNull()
		expect(container.querySelector('.layer')).not.toBeNull()

		stack.push({ mode: 'modal' })
		expect(container.querySelector('.backdrop')).not.toBeNull()

		stack.splice(0, 1)
		expect(container.querySelector('.backdrop')).toBeNull()
	})

	it('if={} with sibling elements preserves siblings', () => {
		const state = reactive({ show: false })
		unmount = bindApp(
			<div>
				<div if={state.show} class="conditional">cond</div>
				<div class="always">always</div>
			</div>,
			container
		)
		expect(container.querySelector('.conditional')).toBeNull()
		expect(container.querySelector('.always')).not.toBeNull()

		state.show = true
		expect(container.querySelector('.conditional')).not.toBeNull()
		expect(container.querySelector('.always')).not.toBeNull()
	})
})

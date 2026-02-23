import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { reactive } from 'mutts'

describe('if={condition} on intrinsic elements', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		//document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
	})

	it('hides element when condition is false', () => {
		const state = reactive({ show: false })
		unmount = latch(
			container,
			<div>
				<span if={state.show} class="target">visible</span>
			</div>
		)
		expect(container.querySelector('.target')).toBeNull()
	})

	it('shows element when condition is true', () => {
		const state = reactive({ show: true })
		unmount = latch(
			container,
			<div>
				<span if={state.show} class="target">visible</span>
			</div>
		)
		expect(container.querySelector('.target')).not.toBeNull()
	})

	it('reactively shows/hides element when condition changes', () => {
		const state = reactive({ show: false })
		unmount = latch(
			container,
			<div>
				<span if={state.show} class="target">visible</span>
			</div>
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

		unmount = latch(
			container,
			<div>
				<div if={hasBackdrop()} class="backdrop">backdrop</div>
				<fragment>children</fragment>
			</div>
		)
		expect(container.querySelector('.backdrop')).toBeNull()
		stack.push({ mode: 'modal' })
		expect(container.querySelector('.backdrop')).not.toBeNull()
		stack.splice(0, 1)
		expect(container.querySelector('.backdrop')).toBeNull()
	})

	it('works with if/else pair', () => {
		const state = reactive({ show: true })
		unmount = latch(
			container,
			<div>
				<span if={state.show} class="yes">yes</span>
				<span else class="no">no</span>
			</div>
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

		unmount = latch(
			container,
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
			</fragment>
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
		unmount = latch(
			container,
			<div>
				<div if={state.show} class="conditional">cond</div>
				<div class="sibling1">sibling1</div>
				<div class="sibling2">sibling2</div>
			</div>
		)
		expect(container.querySelector('.conditional')).toBeNull()
		expect(container.querySelector('.sibling1')).not.toBeNull()
		expect(container.querySelector('.sibling2')).not.toBeNull()

		state.show = true
		expect(container.querySelector('.conditional')).not.toBeNull()
		expect(container.querySelector('.sibling1')).not.toBeNull()
		expect(container.querySelector('.sibling2')).not.toBeNull()
	})

	it('if={} on props.children is respected by the parent component', () => {
		const state = reactive({ show: false })
		const Wrapper: ComponentFunction = (props) => <div class="wrapper">{props.children}</div>

		unmount = latch(
			container,
			<Wrapper>
				<span if={state.show} class="target">visible</span>
			</Wrapper>
		)
		expect(container.querySelector('.target')).toBeNull()
		state.show = true
		expect(container.querySelector('.target')).not.toBeNull()
		state.show = false
		expect(container.querySelector('.target')).toBeNull()
	})

	it('if={} on a conditional element returned by a ReactiveProp getter is respected', () => {
		// Regression: a ReactiveProp in a static children array (isReactive(flatInput)=false,
		// needsMorph=true) that resolves to a conditional PounceElement after collapse().
		// anyConditional must be true (via needsMorph) so lift:conditioned runs.
		const state = reactive({ show: false })
		const child = <span if={state.show} class="target">visible</span>
		unmount = latch(container, <div>{child}</div>)
		expect(container.querySelector('.target')).toBeNull()
		state.show = true
		expect(container.querySelector('.target')).not.toBeNull()
		state.show = false
		expect(container.querySelector('.target')).toBeNull()
	})
})

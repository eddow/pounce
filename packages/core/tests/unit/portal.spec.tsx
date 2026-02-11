import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { reactive, reset } from 'mutts'

describe('<portal> intrinsic', () => {
	let container: HTMLElement
	let portalTarget: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		portalTarget = document.createElement('div')
		portalTarget.id = 'portal-target'
		document.body.appendChild(container)
		document.body.appendChild(portalTarget)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		portalTarget.remove()
		reset()
	})

	it('renders children into the target element (string selector)', () => {
		unmount = bindApp(
			<div>
				<span class="local">stays here</span>
				<portal target="#portal-target">
					<span class="teleported">hello</span>
				</portal>
			</div>,
			container
		)
		// Children should NOT be in the container
		expect(container.querySelector('.teleported')).toBeNull()
		// Children SHOULD be in the portal target
		expect(portalTarget.querySelector('.teleported')).not.toBeNull()
		expect(portalTarget.querySelector('.teleported')!.textContent).toBe('hello')
		// Local content stays
		expect(container.querySelector('.local')).not.toBeNull()
	})

	it('renders children into the target element (element ref)', () => {
		unmount = bindApp(
			<portal target={portalTarget}>
				<span class="direct-ref">content</span>
			</portal>,
			container
		)
		expect(portalTarget.querySelector('.direct-ref')).not.toBeNull()
	})

	it('renders children into the target element (reactive prop)', () => {
		const state = reactive({ target: portalTarget as HTMLElement | null })
		unmount = bindApp(
			<portal target={state.target!}>
				<span class="reactive-target">content</span>
			</portal>,
			container
		)
		expect(portalTarget.querySelector('.reactive-target')).not.toBeNull()
	})

	it('cleans up children from target on unmount', () => {
		unmount = bindApp(
			<portal target="#portal-target">
				<span class="cleanup-test">bye</span>
			</portal>,
			container
		)
		expect(portalTarget.querySelector('.cleanup-test')).not.toBeNull()
		unmount!()
		unmount = undefined
		expect(portalTarget.querySelector('.cleanup-test')).toBeNull()
	})

	it('works with reactive content inside portal', () => {
		const state = reactive({ text: 'initial' })
		unmount = bindApp(
			<portal target="#portal-target">
				<span class="reactive-test">{state.text}</span>
			</portal>,
			container
		)
		expect(portalTarget.querySelector('.reactive-test')!.textContent).toBe('initial')
		state.text = 'updated'
		expect(portalTarget.querySelector('.reactive-test')!.textContent).toBe('updated')
	})

	it('re-teleports children when target changes reactively', () => {
		const targetA = document.createElement('div')
		const targetB = document.createElement('div')
		document.body.appendChild(targetA)
		document.body.appendChild(targetB)
		const state = reactive({ target: targetA as HTMLElement })
		unmount = bindApp(
			<portal target={state.target}>
				<span class="moving">content</span>
			</portal>,
			container
		)
		expect(targetA.querySelector('.moving')).not.toBeNull()
		expect(targetB.querySelector('.moving')).toBeNull()
		state.target = targetB
		expect(targetA.querySelector('.moving')).toBeNull()
		expect(targetB.querySelector('.moving')).not.toBeNull()
		targetA.remove()
		targetB.remove()
	})

	it('conditionally renders portal children with if=', () => {
		const state = reactive({ show: true })
		unmount = bindApp(
			<div>
				<portal target="#portal-target">
					<span if={state.show} class="conditional">visible</span>
				</portal>
			</div>,
			container
		)
		expect(portalTarget.querySelector('.conditional')).not.toBeNull()
		state.show = false
		expect(portalTarget.querySelector('.conditional')).toBeNull()
	})
})

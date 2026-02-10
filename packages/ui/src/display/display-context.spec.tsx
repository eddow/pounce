import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import type { Scope } from '@pounce/core'
import { DisplayProvider, useDisplayContext, defaultDisplayContext } from './display-context'
import { installTestAdapter, resetAdapter } from '../../tests/test-adapter'
import type { DisplayContext } from '../adapter/types'

describe('DisplayProvider', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
		installTestAdapter()
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders a wrapper div with display:contents', () => {
		render(
			<DisplayProvider>
				<span>child</span>
			</DisplayProvider>
		)
		const wrapper = container.querySelector('.pounce-display-provider')
		expect(wrapper).toBeTruthy()
		expect(wrapper?.querySelector('span')?.textContent).toBe('child')
	})

	it('sets data-theme from explicit theme prop', () => {
		render(<DisplayProvider theme="dark"><span /></DisplayProvider>)
		const wrapper = container.querySelector('.pounce-display-provider')
		expect(wrapper?.getAttribute('data-theme')).toBe('dark')
	})

	it('sets dir from explicit direction prop', () => {
		render(<DisplayProvider direction="rtl"><span /></DisplayProvider>)
		const wrapper = container.querySelector('.pounce-display-provider')
		expect(wrapper?.getAttribute('dir')).toBe('rtl')
	})

	it('sets lang from explicit locale prop', () => {
		render(<DisplayProvider locale="fr-FR"><span /></DisplayProvider>)
		const wrapper = container.querySelector('.pounce-display-provider')
		expect(wrapper?.getAttribute('lang')).toBe('fr-FR')
	})

	it('defaults to auto (system defaults) when no props given', () => {
		render(<DisplayProvider><span /></DisplayProvider>)
		const wrapper = container.querySelector('.pounce-display-provider')
		// auto resolves to system defaults — light theme, ltr, en-US in test env
		expect(wrapper?.getAttribute('data-theme')).toBeTruthy()
		expect(wrapper?.getAttribute('dir')).toBeTruthy()
		expect(wrapper?.getAttribute('lang')).toBeTruthy()
	})

	it('exposes context to children via scope', () => {
		let captured: DisplayContext | undefined

		function Child(_props: {}, scope: Scope) {
			captured = useDisplayContext(scope)
			return <span>child</span>
		}

		render(
			<DisplayProvider theme="dark" direction="rtl" locale="ar-SA">
				<Child />
			</DisplayProvider>
		)

		expect(captured).toBeTruthy()
		expect(captured!.theme).toBe('dark')
		expect(captured!.themeSetting).toBe('dark')
		expect(captured!.direction).toBe('rtl')
		expect(captured!.locale).toBe('ar-SA')
	})

	it('nested provider inherits from parent for auto axes', () => {
		let captured: DisplayContext | undefined

		function Child(_props: {}, scope: Scope) {
			captured = useDisplayContext(scope)
			return <span>child</span>
		}

		render(
			<DisplayProvider theme="dark" direction="rtl" locale="ar-SA">
				<DisplayProvider>
					<Child />
				</DisplayProvider>
			</DisplayProvider>
		)

		expect(captured!.theme).toBe('dark')
		expect(captured!.direction).toBe('rtl')
		expect(captured!.locale).toBe('ar-SA')
	})

	it('nested provider overrides specific axes', () => {
		let captured: DisplayContext | undefined

		function Child(_props: {}, scope: Scope) {
			captured = useDisplayContext(scope)
			return <span>child</span>
		}

		render(
			<DisplayProvider theme="dark" direction="rtl" locale="ar-SA">
				<DisplayProvider direction="ltr" locale="en-US">
					<Child />
				</DisplayProvider>
			</DisplayProvider>
		)

		// Theme inherited from parent, direction and locale overridden
		expect(captured!.theme).toBe('dark')
		expect(captured!.direction).toBe('ltr')
		expect(captured!.locale).toBe('en-US')
	})

	it('setTheme updates themeSetting and calls onThemeChange', () => {
		let captured: DisplayContext | undefined
		const changes: string[] = []

		function Child(_props: {}, scope: Scope) {
			captured = useDisplayContext(scope)
			return <span>child</span>
		}

		render(
			<DisplayProvider theme="auto" onThemeChange={(t) => changes.push(t)}>
				<Child />
			</DisplayProvider>
		)

		expect(captured!.themeSetting).toBe('auto')
		captured!.setTheme('dark')
		expect(captured!.themeSetting).toBe('dark')
		expect(captured!.theme).toBe('dark')
		expect(changes).toEqual(['dark'])
	})
})

describe('useDisplayContext', () => {
	it('returns default context when no provider in scope', () => {
		// Simulate empty scope
		const emptyScope = Object.create(null) as Scope
		const ctx = useDisplayContext(emptyScope)
		expect(ctx).toBe(defaultDisplayContext)
		expect(ctx.direction).toBe('ltr')
		expect(typeof ctx.theme).toBe('string')
		expect(typeof ctx.locale).toBe('string')
	})
})

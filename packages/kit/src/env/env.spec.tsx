import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document, rootScope, type Scope } from '@pounce/core'
import { reactive } from 'mutts'
import { Env, type EnvSettings } from './index'

describe('Env', () => {
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

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders a container with display: contents', () => {
		render(
			<Env>
				<span>child</span>
			</Env>
		)
		const el = container.querySelector('.pounce-env')
		expect(el).toBeTruthy()
	})

	it('applies theme to data-theme attribute', () => {
		render(<Env settings={{ theme: 'dark' }}><span /></Env>)
		const el = container.querySelector('.pounce-env')
		expect(el?.getAttribute('data-theme')).toBe('dark')
	})

	it('applies direction to dir attribute', () => {
		render(<Env settings={{ direction: 'rtl' }}><span /></Env>)
		const el = container.querySelector('.pounce-env')
		expect(el?.getAttribute('dir')).toBe('rtl')
	})

	it('applies locale to lang attribute', () => {
		render(<Env settings={{ locale: 'fr-FR' }}><span /></Env>)
		const el = container.querySelector('.pounce-env')
		expect(el?.getAttribute('lang')).toBe('fr-FR')
	})

	it('uses default timeZone from rootScope', () => {
		render(<Env><span /></Env>)
		// rootScope.timeZone should be available (set by env/index.tsx initialization)
		expect(rootScope.timeZone).toBeDefined()
	})

	describe('scope values', () => {
		it('makes override values available to children via scope', () => {
			let captured: Scope | undefined
			function Inspector(_props: {}, scope: Scope) {
				captured = scope
				return <span />
			}

			render(
				<Env settings={{ theme: 'dark', direction: 'rtl', locale: 'ar-SA' }}>
					<Inspector />
				</Env>
			)

			expect(captured?.theme).toBe('dark')
			expect(captured?.direction).toBe('rtl')
			expect(captured?.locale).toBe('ar-SA')
		})

		it('inherits parent scope values when nested with auto', () => {
			let captured: Scope | undefined
			function Inspector(_props: {}, scope: Scope) {
				captured = scope
				return <span />
			}

			render(
				<Env settings={{ theme: 'dark', direction: 'rtl', locale: 'ar-SA' }}>
					<Env settings={{ theme: 'auto' }}>
						<Inspector />
					</Env>
				</Env>
			)

			// Inner 'auto' should inherit outer 'dark'
			expect(captured?.theme).toBe('dark')
			expect(captured?.direction).toBe('rtl')
			expect(captured?.locale).toBe('ar-SA')
		})

		it('allows inner Env to override only specific axes', () => {
			let captured: Scope | undefined
			function Inspector(_props: {}, scope: Scope) {
				captured = scope
				return <span />
			}

			render(
				<Env settings={{ theme: 'dark', direction: 'rtl', locale: 'ar-SA' }}>
					<Env settings={{ direction: 'ltr', locale: 'en-US' }}>
						<Inspector />
					</Env>
				</Env>
			)

			expect(captured?.theme).toBe('dark')
			expect(captured?.direction).toBe('ltr')
			expect(captured?.locale).toBe('en-US')
		})
	})

	describe('reactive settings', () => {
		it('updates scope when settings change', () => {
			let captured: Scope | undefined
			function Inspector(_props: {}, scope: Scope) {
				captured = scope
				return <span />
			}

			const settings = reactive<EnvSettings>({ theme: 'light' })
			render(
				<Env settings={settings}>
					<Inspector />
				</Env>
			)

			expect(captured?.theme).toBe('light')

			settings.theme = 'dark'
			expect(captured?.theme).toBe('dark')
		})
	})
})

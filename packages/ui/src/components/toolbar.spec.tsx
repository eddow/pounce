/// <reference path="../../node_modules/@pounce/core/src/types/jsx.d.ts" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { Toolbar } from '../../src/components/toolbar'
import { setAdapter, resetAdapter } from '../../src/adapter/registry'

describe('Toolbar', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with default props', () => {
		render(<Toolbar>Content</Toolbar>)
		const toolbar = container.querySelector('.pounce-toolbar')
		expect(toolbar).toBeTruthy()
		expect(toolbar?.getAttribute('role')).toBe('toolbar')
		expect(toolbar?.textContent).toContain('Content')
	})

	it('applies horizontal orientation by default', () => {
		render(<Toolbar>Content</Toolbar>)
		const toolbar = container.querySelector('.pounce-toolbar')
		expect(toolbar?.classList.contains('pounce-toolbar-horizontal')).toBe(true)
	})

	it('applies vertical orientation when specified', () => {
		render(<Toolbar orientation="vertical">Content</Toolbar>)
		const toolbar = container.querySelector('.pounce-toolbar')
		expect(toolbar?.classList.contains('pounce-toolbar-vertical')).toBe(true)
		expect(toolbar?.classList.contains('pounce-toolbar-horizontal')).toBe(false)
	})

	it('applies custom class names', () => {
		render(<Toolbar class="custom-toolbar">Content</Toolbar>)
		const toolbar = container.querySelector('.pounce-toolbar')
		expect(toolbar?.classList.contains('custom-toolbar')).toBe(true)
	})

	it('applies custom styles', () => {
		render(<Toolbar style={{ background: 'red' }}>Content</Toolbar>)
		const toolbar = container.querySelector('.pounce-toolbar') as HTMLElement
		expect(toolbar?.style.background).toBe('red')
	})

	it('respects adapter overrides for root class', () => {
		setAdapter({
			Toolbar: {
				classes: {
					root: 'custom-toolbar-root',
					orientation: (dir) => `custom-toolbar-${dir}`,
				},
			},
		})

		render(<Toolbar orientation="vertical">Content</Toolbar>)
		const toolbar = container.querySelector('.custom-toolbar-root')
		expect(toolbar).toBeTruthy()
		expect(toolbar?.classList.contains('custom-toolbar-vertical')).toBe(true)
	})
})

describe('Toolbar.Spacer', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders invisible spacer by default', () => {
		render(<Toolbar.Spacer />)
		const spacer = container.querySelector('.pounce-toolbar-spacer')
		expect(spacer).toBeTruthy()
		expect(spacer?.classList.contains('pounce-toolbar-spacer-visible')).toBe(false)
	})

	it('renders visible spacer when specified', () => {
		render(<Toolbar.Spacer visible={true} />)
		const spacer = container.querySelector('.pounce-toolbar-spacer')
		expect(spacer?.classList.contains('pounce-toolbar-spacer-visible')).toBe(true)
	})

	it('applies custom width with fixed flex', () => {
		render(<Toolbar.Spacer width="2rem" />)
		const spacer = container.querySelector('.pounce-toolbar-spacer') as HTMLElement
		expect(spacer?.getAttribute('style')).toContain('width: 2rem')
		expect(spacer?.getAttribute('style')).toContain('flex:')
	})

	it('applies custom class names', () => {
		render(<Toolbar.Spacer class="custom-spacer" />)
		const spacer = container.querySelector('.pounce-toolbar-spacer')
		expect(spacer?.classList.contains('custom-spacer')).toBe(true)
	})

	it('respects adapter overrides for spacer classes', () => {
		setAdapter({
			Toolbar: {
				classes: {
					spacer: 'custom-spacer',
					spacerVisible: 'custom-spacer-visible',
				},
			},
		})

		render(<Toolbar.Spacer visible={true} />)
		const spacer = container.querySelector('.custom-spacer')
		expect(spacer).toBeTruthy()
		expect(spacer?.classList.contains('custom-spacer-visible')).toBe(true)
	})
})

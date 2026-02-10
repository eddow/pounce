/**
 * Tests for Layout components: Stack, Inline, Grid, Container, AppShell
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { Stack, Inline, Grid, Container, AppShell } from '../../src/components/layout'
import { installTestAdapter, resetAdapter } from '../test-adapter'

describe('Stack', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		installTestAdapter()
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		document.body.innerHTML = ''
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with default class', () => {
		resetAdapter()
		render(<Stack><div>A</div><div>B</div></Stack>)
		const stack = container.querySelector('.pounce-stack')
		expect(stack).toBeTruthy()
		expect(stack?.tagName).toBe('DIV')
	})

	it('uses adapter class override', () => {
		render(<Stack><div>A</div></Stack>)
		const stack = container.querySelector('.test-stack')
		expect(stack).toBeTruthy()
	})

	it('applies custom gap via spacing token', () => {
		render(<Stack gap="lg"><div>A</div></Stack>)
		const stack = container.querySelector('.test-stack') as HTMLElement
		expect(stack).toBeTruthy()
		const style = stack?.getAttribute('style') ?? ''
		expect(style).toContain('gap')
	})

	it('applies alignment', () => {
		render(<Stack align="center"><div>A</div></Stack>)
		const stack = container.querySelector('.test-stack') as HTMLElement
		const style = stack?.getAttribute('style') ?? ''
		expect(style).toContain('center')
	})

	it('applies justify', () => {
		render(<Stack justify="between"><div>A</div></Stack>)
		const stack = container.querySelector('.test-stack') as HTMLElement
		const style = stack?.getAttribute('style') ?? ''
		expect(style).toContain('space-between')
	})

	it('passes custom class', () => {
		render(<Stack class="my-stack"><div>A</div></Stack>)
		const stack = container.querySelector('.test-stack')
		expect(stack?.classList.contains('my-stack')).toBe(true)
	})
})

describe('Inline', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		installTestAdapter()
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		document.body.innerHTML = ''
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with default class', () => {
		resetAdapter()
		render(<Inline><span>A</span><span>B</span></Inline>)
		const inline = container.querySelector('.pounce-inline')
		expect(inline).toBeTruthy()
	})

	it('uses adapter class override', () => {
		render(<Inline><span>A</span></Inline>)
		const inline = container.querySelector('.test-inline')
		expect(inline).toBeTruthy()
	})

	it('applies scrollable class', () => {
		render(<Inline scrollable><span>A</span></Inline>)
		const inline = container.querySelector('.test-inline')
		expect(inline?.classList.contains('pounce-inline--scrollable')).toBe(true)
	})

	it('applies wrap style', () => {
		render(<Inline wrap><span>A</span></Inline>)
		const inline = container.querySelector('.test-inline') as HTMLElement
		const style = inline?.getAttribute('style') ?? ''
		expect(style).toContain('wrap')
	})

	it('defaults to nowrap', () => {
		render(<Inline><span>A</span></Inline>)
		const inline = container.querySelector('.test-inline') as HTMLElement
		const style = inline?.getAttribute('style') ?? ''
		expect(style).toContain('nowrap')
	})

	it('passes custom class', () => {
		render(<Inline class="my-inline"><span>A</span></Inline>)
		const inline = container.querySelector('.test-inline')
		expect(inline?.classList.contains('my-inline')).toBe(true)
	})
})

describe('Grid', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		installTestAdapter()
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		document.body.innerHTML = ''
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with default class', () => {
		resetAdapter()
		render(<Grid><div>A</div></Grid>)
		const grid = container.querySelector('.pounce-grid')
		expect(grid).toBeTruthy()
	})

	it('uses adapter class override', () => {
		render(<Grid><div>A</div></Grid>)
		const grid = container.querySelector('.test-grid')
		expect(grid).toBeTruthy()
	})

	it('applies numeric columns', () => {
		render(<Grid columns={3}><div>A</div></Grid>)
		const grid = container.querySelector('.test-grid') as HTMLElement
		const style = grid?.getAttribute('style') ?? ''
		expect(style).toContain('repeat(3')
	})

	it('applies string columns', () => {
		render(<Grid columns="1fr 2fr"><div>A</div></Grid>)
		const grid = container.querySelector('.test-grid') as HTMLElement
		const style = grid?.getAttribute('style') ?? ''
		expect(style).toContain('1fr 2fr')
	})

	it('applies minItemWidth auto-fit', () => {
		render(<Grid minItemWidth="200px"><div>A</div></Grid>)
		const grid = container.querySelector('.test-grid') as HTMLElement
		const style = grid?.getAttribute('style') ?? ''
		expect(style).toContain('auto-fit')
		expect(style).toContain('200px')
	})

	it('passes custom class', () => {
		render(<Grid class="my-grid"><div>A</div></Grid>)
		const grid = container.querySelector('.test-grid')
		expect(grid?.classList.contains('my-grid')).toBe(true)
	})
})

describe('Container', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		installTestAdapter()
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		document.body.innerHTML = ''
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders with default container class', () => {
		resetAdapter()
		render(<Container>Content</Container>)
		const el = container.querySelector('.container')
		expect(el).toBeTruthy()
	})

	it('uses adapter class override', () => {
		render(<Container>Content</Container>)
		const el = container.querySelector('.test-container')
		expect(el).toBeTruthy()
	})

	it('applies fluid class', () => {
		resetAdapter()
		render(<Container fluid>Content</Container>)
		const el = container.querySelector('.container-fluid')
		expect(el).toBeTruthy()
	})

	it('supports custom tag', () => {
		render(<Container tag="section">Content</Container>)
		const el = container.querySelector('.test-container')
		expect(el?.tagName).toBe('SECTION')
	})
})

describe('AppShell', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		installTestAdapter()
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		document.body.innerHTML = ''
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('renders header and main', () => {
		render(<AppShell header={<nav>Nav</nav>}>Body</AppShell>)
		const shell = container.querySelector('.pounce-app-shell')
		expect(shell).toBeTruthy()
		const header = shell?.querySelector('.pounce-app-shell-header')
		expect(header).toBeTruthy()
		expect(header?.textContent).toContain('Nav')
		const main = shell?.querySelector('.pounce-app-shell-main')
		expect(main).toBeTruthy()
		expect(main?.textContent).toContain('Body')
	})
})

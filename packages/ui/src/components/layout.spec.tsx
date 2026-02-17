/// <reference path="../../node_modules/@pounce/core/src/types/jsx.d.ts" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { Stack, Inline, Grid, Container, AppShell } from '../../src/components/layout'

describe('Stack', () => {
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
		unmount = latch(container, element)
	}

	it('renders with default props', () => {
		render(
			<Stack>
				<div>Item 1</div>
				<div>Item 2</div>
			</Stack>
		)

		const stack = container.querySelector('.pounce-stack')
		expect(stack).toBeTruthy()
		expect(stack?.children.length).toBe(2)
	})

	it('applies custom gap spacing', () => {
		render(<Stack gap="lg"><div>Item</div></Stack>)
		const stack = container.querySelector('.pounce-stack') as HTMLElement
		expect(stack?.style.gap).toContain('var(--pounce-spacing)')
	})

	it('applies alignment', () => {
		render(<Stack align="center"><div>Item</div></Stack>)
		const stack = container.querySelector('.pounce-stack') as HTMLElement
		expect(stack?.style.alignItems).toBe('center')
	})

	it('applies justify content', () => {
		render(<Stack justify="between"><div>Item</div></Stack>)
		const stack = container.querySelector('.pounce-stack') as HTMLElement
		expect(stack?.style.justifyContent).toBe('space-between')
	})

	it('supports custom classes', () => {
		render(<Stack class="custom-stack"><div>Item</div></Stack>)
		const stack = container.querySelector('.pounce-stack')
		expect(stack?.classList.contains('custom-stack')).toBe(true)
	})
})

describe('Inline', () => {
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
		unmount = latch(container, element)
	}

	it('renders with default props', () => {
		render(
			<Inline>
				<div>Item 1</div>
				<div>Item 2</div>
			</Inline>
		)

		const inline = container.querySelector('.pounce-inline')
		expect(inline).toBeTruthy()
		expect(inline?.children.length).toBe(2)
	})

	it('applies scrollable modifier', () => {
		render(<Inline scrollable><div>Item</div></Inline>)
		const inline = container.querySelector('.pounce-inline')
		expect(inline?.classList.contains('pounce-inline--scrollable')).toBe(true)
	})

	it('applies wrap style', () => {
		render(<Inline wrap><div>Item</div></Inline>)
		const inline = container.querySelector('.pounce-inline') as HTMLElement
		expect(inline?.style.flexWrap).toBe('wrap')
	})

	it('applies nowrap by default', () => {
		render(<Inline><div>Item</div></Inline>)
		const inline = container.querySelector('.pounce-inline') as HTMLElement
		expect(inline?.style.flexWrap).toBe('nowrap')
	})

	it('applies custom gap', () => {
		render(<Inline gap="xl"><div>Item</div></Inline>)
		const inline = container.querySelector('.pounce-inline') as HTMLElement
		expect(inline?.style.gap).toContain('var(--pounce-spacing)')
	})
})

describe('Grid', () => {
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
		unmount = latch(container, element)
	}

	it('renders with default props', () => {
		render(
			<Grid>
				<div>Item 1</div>
				<div>Item 2</div>
			</Grid>
		)

		const grid = container.querySelector('.pounce-grid')
		expect(grid).toBeTruthy()
		expect(grid?.children.length).toBe(2)
	})

	it('applies column count', () => {
		render(<Grid columns={3}><div>Item</div></Grid>)
		const grid = container.querySelector('.pounce-grid') as HTMLElement
		expect(grid?.style.gridTemplateColumns).toMatch(/repeat\(3, minmax\(0(px)?, 1fr\)\)/)
	})

	it('applies custom column template', () => {
		render(<Grid columns="1fr 2fr"><div>Item</div></Grid>)
		const grid = container.querySelector('.pounce-grid') as HTMLElement
		expect(grid?.style.gridTemplateColumns).toBe('1fr 2fr')
	})

	it('applies minItemWidth for auto-fit', () => {
		render(<Grid minItemWidth="200px"><div>Item</div></Grid>)
		const grid = container.querySelector('.pounce-grid') as HTMLElement
		expect(grid?.style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(200px, 1fr))')
	})

	it('applies custom gap', () => {
		render(<Grid gap="sm"><div>Item</div></Grid>)
		const grid = container.querySelector('.pounce-grid') as HTMLElement
		expect(grid?.style.gap).toContain('var(--pounce-spacing)')
	})

	it('applies alignment', () => {
		render(<Grid align="center"><div>Item</div></Grid>)
		const grid = container.querySelector('.pounce-grid') as HTMLElement
		expect(grid?.style.alignItems).toBe('center')
	})
})

describe('Container', () => {
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
		unmount = latch(container, element)
	}

	it('renders with default container class', () => {
		render(<Container><div>Content</div></Container>)
		const containerEl = container.querySelector('.container')
		expect(containerEl).toBeTruthy()
	})

	it('renders with fluid class when fluid prop is true', () => {
		render(<Container fluid><div>Content</div></Container>)
		const containerEl = container.querySelector('.container-fluid')
		expect(containerEl).toBeTruthy()
		expect(container.querySelector('.container')).toBeFalsy()
	})

	it('supports custom tag', () => {
		render(<Container tag="section"><div>Content</div></Container>)
		const containerEl = container.querySelector('.container')
		expect(containerEl?.tagName).toBe('SECTION')
	})
})

describe('AppShell', () => {
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
		unmount = latch(container, element)
	}

	it('renders header and main content', () => {
		render(
			<AppShell header={<div class="test-header">Header</div>}>
				<div class="test-main">Main Content</div>
			</AppShell>
		)

		const shell = container.querySelector('.pounce-app-shell')
		expect(shell).toBeTruthy()
		
		const header = shell?.querySelector('.pounce-app-shell-header')
		expect(header).toBeTruthy()
		expect(header?.querySelector('.test-header')).toBeTruthy()

		const main = shell?.querySelector('.pounce-app-shell-main')
		expect(main).toBeTruthy()
		expect(main?.querySelector('.test-main')).toBeTruthy()
	})

	it('header has sticky class', () => {
		render(
			<AppShell header={<div>Header</div>}>
				<div>Content</div>
			</AppShell>
		)

		const header = container.querySelector('.pounce-app-shell-header')
		expect(header).toBeTruthy()
		expect(header?.tagName.toLowerCase()).toBe('header')
	})
})

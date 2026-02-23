import { ReactiveProp } from '@pounce/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sizeable } from './sizeable'

function rp(initial: number) {
	let v = initial
	return new ReactiveProp(
		() => v,
		(n) => {
			v = n
		}
	)
}

describe('sizeable directive', () => {
	let container: HTMLElement
	let parent: HTMLElement
	let element: HTMLElement
	let flexSibling: HTMLElement

	beforeEach(() => {
		container = document.createElement('div')
		parent = document.createElement('div')
		element = document.createElement('div')
		flexSibling = document.createElement('div')

		parent.style.display = 'flex'
		parent.appendChild(element)
		parent.appendChild(flexSibling)
		container.appendChild(parent)
		document.body.appendChild(container)

		flexSibling.style.flex = '1'
	})

	afterEach(() => {
		document.body.removeChild(container)
	})

	it('detects horizontal direction for flex row', () => {
		const cleanup = sizeable(element, rp(300))
		expect(element.classList.contains('sizeable')).toBe(true)
		expect(element.classList.contains('sizeable-right')).toBe(true)
		cleanup?.()
	})

	it('detects edge based on element position', () => {
		parent.appendChild(element) // Move to end — now after flex sibling
		const cleanup = sizeable(element, rp(300))
		expect(element.classList.contains('sizeable-left')).toBe(true)
		cleanup?.()
	})

	it('creates resize handle with correct cursor', () => {
		const cleanup = sizeable(element, rp(300))
		const handle = element.querySelector('.sizeable-handle')
		expect(handle).toBeTruthy()
		expect(handle?.classList.contains('sizeable-handle-right')).toBe(true)
		expect((handle as HTMLElement).style.cursor).toBe('col-resize')
		cleanup?.()
	})

	it('initializes CSS variable from value', () => {
		const cleanup = sizeable(element, rp(250))
		expect(parent.style.getPropertyValue('--sizeable-width')).toBe('250px')
		cleanup?.()
	})

	it('updates CSS variable and writes back on drag', () => {
		const prop = rp(300)
		const cleanup = sizeable(element, prop)
		const handle = element.querySelector('.sizeable-handle') as HTMLElement

		handle?.dispatchEvent(new MouseEvent('mousedown', { clientX: 100 }))
		document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150 }))
		document.dispatchEvent(new MouseEvent('mouseup'))

		expect(parent.style.getPropertyValue('--sizeable-width')).toBe('50px')
		expect(prop.get()).toBe(50)
		cleanup?.()
	})

	it('warns when no flex:1 sibling found', () => {
		flexSibling.style.flex = '0'
		const consoleSpy = vi.spyOn(console, 'warn')
		const cleanup = sizeable(element, rp(300))
		expect(consoleSpy).toHaveBeenCalledWith('use:sizeable requires exactly one flex:1 sibling')
		cleanup?.()
		consoleSpy.mockRestore()
	})

	it('supports vertical direction', () => {
		parent.style.flexDirection = 'column'
		const cleanup = sizeable(element, rp(300))
		expect(element.classList.contains('sizeable-bottom')).toBe(true)

		const handle = element.querySelector('.sizeable-handle') as HTMLElement
		expect(handle?.classList.contains('sizeable-handle-bottom')).toBe(true)
		expect(handle?.style.cursor).toBe('row-resize')

		cleanup?.()
	})

	it('initializes CSS variable for vertical direction', () => {
		parent.style.flexDirection = 'column'
		const cleanup = sizeable(element, rp(200))
		expect(parent.style.getPropertyValue('--sizeable-height')).toBe('200px')
		cleanup?.()
	})

	it('cleans up handle and classes on unmount', () => {
		const cleanup = sizeable(element, rp(300))
		expect(element.querySelector('.sizeable-handle')).toBeTruthy()
		cleanup?.()
		expect(element.querySelector('.sizeable-handle')).toBeNull()
		expect(element.classList.contains('sizeable')).toBe(false)
	})
})

import { document } from '@pounce/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	type BadgeOptions,
	badge,
	drag,
	dragging,
	drop,
	type IntersectOptions,
	intersect,
	loading,
	type PointerState,
	pointer,
	resize,
	scroll,
	tail,
} from './directives'

describe('Directives', () => {
	describe('pointer', () => {
		let element: HTMLElement
		let cleanup: (() => void) | undefined

		beforeEach(() => {
			element = document.createElement('div')
			document.body.appendChild(element)
		})

		afterEach(() => {
			cleanup?.()
			element.remove()
		})

		it('should attach pointer event listeners', () => {
			const state = { value: undefined as PointerState | undefined }
			cleanup = pointer(element, state)

			const moveEvent = new PointerEvent('pointermove')
			Object.defineProperty(moveEvent, 'offsetX', { value: 50 })
			Object.defineProperty(moveEvent, 'offsetY', { value: 75 })
			Object.defineProperty(moveEvent, 'buttons', { value: 0 })
			element.dispatchEvent(moveEvent)

			expect(state.value).toEqual({ x: 50, y: 75, buttons: 0 })
		})

		it('should handle pointer leave', () => {
			const state = { value: { x: 10, y: 20, buttons: 0 } as PointerState | undefined }
			cleanup = pointer(element, state)

			const leaveEvent = new PointerEvent('pointerleave')
			element.dispatchEvent(leaveEvent)

			expect(state.value).toBeUndefined()
		})

		it('should return cleanup function', () => {
			const result = pointer(element, { value: undefined })
			expect(typeof result).toBe('function')
			result?.()
		})

		it('should handle non-HTMLElement target', () => {
			const textNode = document.createTextNode('text')
			const result = pointer(textNode, { value: undefined })
			expect(result).toBeUndefined()
		})
	})

	describe('resize', () => {
		let element: HTMLElement
		let cleanup: (() => void) | undefined

		beforeEach(() => {
			element = document.createElement('div')
			document.body.appendChild(element)
			// Mock ResizeObserver
			globalThis.ResizeObserver = vi.fn().mockImplementation(function (callback) {
				return {
					observe: vi.fn(),
					disconnect: vi.fn(),
					unobserve: vi.fn(),
					trigger: (entries: ResizeObserverEntry[]) => callback(entries),
				}
			})
		})

		afterEach(() => {
			cleanup?.()
			element.remove()
		})

		it('should create ResizeObserver', () => {
			const state = { width: 100, height: 200 }
			cleanup = resize(element, state)
			expect(ResizeObserver).toHaveBeenCalled()
		})

		it('should return cleanup function', () => {
			const result = resize(element, {})
			expect(typeof result).toBe('function')
			result?.()
		})

		it('should handle non-HTMLElement target', () => {
			const textNode = document.createTextNode('text')
			const result = resize(textNode, {})
			expect(result).toBeUndefined()
		})
	})

	describe('scroll', () => {
		let element: HTMLElement
		let cleanup: (() => void) | undefined

		beforeEach(() => {
			element = document.createElement('div')
			document.body.appendChild(element)
			// Mock ResizeObserver
			globalThis.ResizeObserver = vi.fn().mockImplementation(function () {
				return {
					observe: vi.fn(),
					disconnect: vi.fn(),
					unobserve: vi.fn(),
				}
			})
		})

		afterEach(() => {
			cleanup?.()
			element.remove()
		})

		it('should set initial scroll position from number value', () => {
			const value = { x: 50, y: 100 }
			cleanup = scroll(element, value)
			expect(element.scrollLeft).toBe(50)
			expect(element.scrollTop).toBe(100)
		})

		it('should return cleanup function', () => {
			const result = scroll(element, {})
			expect(typeof result).toBe('function')
			result?.()
		})

		it('should handle non-HTMLElement target', () => {
			const textNode = document.createTextNode('text')
			const result = scroll(textNode, {})
			expect(result).toBeUndefined()
		})
	})

	describe('intersect', () => {
		let element: HTMLElement
		let cleanup: (() => void) | undefined

		beforeEach(() => {
			element = document.createElement('div')
			document.body.appendChild(element)
			// Mock IntersectionObserver
			globalThis.IntersectionObserver = vi.fn().mockImplementation(function () {
				return {
					observe: vi.fn(),
					disconnect: vi.fn(),
					unobserve: vi.fn(),
					takeRecords: vi.fn(),
					root: null,
					rootMargin: '',
					thresholds: [],
				}
			})
		})

		afterEach(() => {
			cleanup?.()
			element.remove()
		})

		it('should create IntersectionObserver with correct options', () => {
			const options: IntersectOptions = {
				root: null,
				rootMargin: '10px',
				threshold: 0.5,
			}
			cleanup = intersect(element, options)
			expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
				root: null,
				rootMargin: '10px',
				threshold: 0.5,
			})
		})

		it('should return cleanup function', () => {
			const result = intersect(element, {})
			expect(typeof result).toBe('function')
			result?.()
		})

		it('should handle non-HTMLElement target', () => {
			const textNode = document.createTextNode('text')
			const result = intersect(textNode, {})
			expect(result).toBeUndefined()
		})
	})

	describe('badge', () => {
		let element: HTMLElement
		let cleanup: (() => void) | undefined

		beforeEach(() => {
			element = document.createElement('button')
			document.body.appendChild(element)
		})

		afterEach(() => {
			cleanup?.()
			element.remove()
		})

		it('should add badge with string value', () => {
			cleanup = badge(element, '5')

			expect(element.classList.contains('pounce-badged')).toBe(true)
			expect(element.classList.contains('pounce-badged-top-right')).toBe(true)

			const badgeEl = element.querySelector('.pounce-badge-floating')
			expect(badgeEl).toBeTruthy()
			expect(badgeEl?.getAttribute('aria-hidden')).toBe('true')
		})

		it('should add badge with options', () => {
			const options: BadgeOptions = {
				value: '10',
				position: 'bottom-left',
				class: 'custom-class',
			}
			cleanup = badge(element, options)

			expect(element.classList.contains('pounce-badged-bottom-left')).toBe(true)
			const badgeEl = element.querySelector('.pounce-badge-floating')
			expect(badgeEl?.classList.contains('custom-class')).toBe(true)
		})

		it('should return cleanup function that removes badge', () => {
			const result = badge(element, '5')
			expect(element.querySelector('.pounce-badge-floating')).toBeTruthy()

			result?.()

			expect(element.querySelector('.pounce-badge-floating')).toBeFalsy()
			expect(element.classList.contains('pounce-badged')).toBe(false)
		})

		it('should handle non-HTMLElement target', () => {
			const textNode = document.createTextNode('text')
			const result = badge(textNode, '5')
			expect(result).toBeUndefined()
		})
	})

	describe('tail', () => {
		let element: HTMLElement
		let cleanup: (() => void) | undefined
		let mutationCallback: MutationCallback

		beforeEach(() => {
			element = document.createElement('div')
			document.body.appendChild(element)
			// Mock MutationObserver
			globalThis.MutationObserver = vi.fn().mockImplementation(function (
				callback: MutationCallback
			) {
				mutationCallback = callback
				return {
					observe: vi.fn(),
					disconnect: vi.fn(),
				}
			})
		})

		afterEach(() => {
			cleanup?.()
			element.remove()
		})

		it('should return cleanup function', () => {
			const result = tail(element, true)
			expect(typeof result).toBe('function')
			result?.()
		})

		it('should handle non-HTMLElement target', () => {
			const textNode = document.createTextNode('text')
			const result = tail(textNode, true)
			expect(result).toBeUndefined()
		})

		it('should be disabled when value is false', () => {
			const result = tail(element, false)
			expect(result).toBeUndefined()
		})

		it('should default to enabled when value is undefined', () => {
			const result = tail(element, undefined)
			expect(typeof result).toBe('function')
			result?.()
		})

		it('should attach scroll listener and MutationObserver', () => {
			const addSpy = vi.spyOn(element, 'addEventListener')
			cleanup = tail(element, true)

			expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
			expect(MutationObserver).toHaveBeenCalled()
		})

		it('should remove listeners on cleanup', () => {
			const removeSpy = vi.spyOn(element, 'removeEventListener')
			cleanup = tail(element, true)
			const disconnectFn = (MutationObserver as any).mock.results[0].value.disconnect

			cleanup!()
			cleanup = undefined

			expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
			expect(disconnectFn).toHaveBeenCalled()
		})

		it('should accept array target', () => {
			const result = tail([element], true)
			expect(typeof result).toBe('function')
			result?.()
		})
	})

	describe('loading', () => {
		let element: HTMLElement
		let cleanup: (() => void) | undefined

		beforeEach(() => {
			element = document.createElement('button')
			document.body.appendChild(element)
		})

		afterEach(() => {
			cleanup?.()
			element.remove()
		})

		it('should set aria-busy when true', () => {
			cleanup = loading(element, true)
			expect(element.getAttribute('aria-busy')).toBe('true')
		})

		it('should not set aria-busy when false', () => {
			cleanup = loading(element, false)
			expect(element.hasAttribute('aria-busy')).toBe(false)
		})

		it('should disable form elements when true', () => {
			cleanup = loading(element, true)
			expect((element as HTMLButtonElement).disabled).toBe(true)
		})

		it('should re-enable form elements when false', () => {
			loading(element, true)
			cleanup = loading(element, false)
			expect((element as HTMLButtonElement).disabled).toBe(false)
		})

		it('should not set disabled on non-form elements', () => {
			const div = document.createElement('div')
			document.body.appendChild(div)
			cleanup = loading(div, true)
			expect(div.hasAttribute('disabled')).toBe(false)
			expect(div.getAttribute('aria-busy')).toBe('true')
			div.remove()
		})

		it('should work on input elements', () => {
			const input = document.createElement('input')
			document.body.appendChild(input)
			const c = loading(input, true)
			expect((input as HTMLInputElement).disabled).toBe(true)
			expect(input.getAttribute('aria-busy')).toBe('true')
			c?.()
			input.remove()
		})

		it('should use loading class override', () => {
			cleanup = loading(element, true, {}, 'custom-loading')
			expect(element.classList.contains('custom-loading')).toBe(true)
		})

		it('should clean up on unmount', () => {
			cleanup = loading(element, true)
			expect(element.getAttribute('aria-busy')).toBe('true')
			expect((element as HTMLButtonElement).disabled).toBe(true)

			cleanup?.()
			cleanup = undefined

			expect(element.hasAttribute('aria-busy')).toBe(false)
			expect((element as HTMLButtonElement).disabled).toBe(false)
		})

		it('should handle non-HTMLElement target', () => {
			const textNode = document.createTextNode('text')
			const result = loading(textNode, true)
			expect(result).toBeUndefined()
		})

		it('should handle array target', () => {
			cleanup = loading([element], true)
			expect(element.getAttribute('aria-busy')).toBe('true')
		})
	})

	describe('drag and drop', () => {
		let element: HTMLElement
		let targetElement: HTMLElement
		let cleanupDrag: (() => void) | undefined
		let cleanupDrop: (() => void) | undefined
		let cleanupDragging: (() => void) | undefined

		beforeEach(() => {
			element = document.createElement('div')
			targetElement = document.createElement('div')
			document.body.appendChild(element)
			document.body.appendChild(targetElement)
		})

		afterEach(() => {
			// reset internal state by firing dragend on a dummy instance
			const resetEl = document.createElement('div')
			const resetCleanup = drag(resetEl, null)
			resetEl.dispatchEvent(new Event('dragstart') as DragEvent) // Sets to null
			resetEl.dispatchEvent(new Event('dragend') as DragEvent) // Sets to undefined
			resetCleanup?.()

			cleanupDrag?.()
			cleanupDrop?.()
			cleanupDragging?.()
			element.remove()
			targetElement.remove()
		})

		it('drag should set draggable and track payload', () => {
			cleanupDrag = drag(element, { id: 1 })
			expect(element.getAttribute('draggable')).toBe('true')

			const dragStartEvent = new Event('dragstart') as DragEvent
			element.dispatchEvent(dragStartEvent)

			// The payload is active, let's test it by setting up a drop
			let droppedPayload: any = null
			cleanupDrop = drop(targetElement, (p) => {
				droppedPayload = p
			})

			const dropEvent = new Event('drop') as DragEvent
			dropEvent.preventDefault = vi.fn()
			targetElement.dispatchEvent(dropEvent)

			expect(droppedPayload).toEqual({ id: 1 })
		})

		it('drag should evaluate function payloads', () => {
			cleanupDrag = drag(element, () => ({ dynamic: true }))
			const dragStartEvent = new Event('dragstart') as DragEvent
			element.dispatchEvent(dragStartEvent)

			let droppedPayload: any = null
			cleanupDrop = drop(targetElement, (p) => {
				droppedPayload = p
			})

			const dropEvent = new Event('drop') as DragEvent
			dropEvent.preventDefault = vi.fn()
			targetElement.dispatchEvent(dropEvent)

			expect(droppedPayload).toEqual({ dynamic: true })
		})

		it('drag should clear payload on dragend', () => {
			cleanupDrag = drag(element, 'test')
			element.dispatchEvent(new Event('dragstart') as DragEvent)
			element.dispatchEvent(new Event('dragend') as DragEvent)

			let droppedPayload: any = null
			cleanupDrop = drop(targetElement, (p) => {
				droppedPayload = p
			})

			const dropEvent = new Event('drop') as DragEvent
			targetElement.dispatchEvent(dropEvent)

			expect(droppedPayload).toBeNull() // Drop shouldn't have executed
		})

		it('drop should preventDefault during dragover if payload is active', () => {
			cleanupDrag = drag(element, 'test')
			element.dispatchEvent(new Event('dragstart') as DragEvent)

			cleanupDrop = drop(targetElement, vi.fn())

			const dragOverEvent = new Event('dragover') as DragEvent
			dragOverEvent.preventDefault = vi.fn()
			targetElement.dispatchEvent(dragOverEvent)

			expect(dragOverEvent.preventDefault).toHaveBeenCalled()
		})

		it('drop should not preventDefault during dragover if no payload is active', () => {
			cleanupDrop = drop(targetElement, vi.fn())

			const dragOverEvent = new Event('dragover') as DragEvent
			dragOverEvent.preventDefault = vi.fn()
			targetElement.dispatchEvent(dragOverEvent)

			expect(dragOverEvent.preventDefault).not.toHaveBeenCalled()
		})

		it('dragging should manage hover state and cleanup', () => {
			cleanupDrag = drag(element, 'payload')
			element.dispatchEvent(new Event('dragstart') as DragEvent)

			const cleanupHoverFn = vi.fn()
			const draggingCallback = vi.fn().mockReturnValue(cleanupHoverFn)

			cleanupDragging = dragging(targetElement, draggingCallback)

			const dragEnterEvent = new Event('dragenter') as DragEvent
			dragEnterEvent.preventDefault = vi.fn()
			targetElement.dispatchEvent(dragEnterEvent)

			expect(draggingCallback).toHaveBeenCalledWith('payload', true, targetElement)
			expect(dragEnterEvent.preventDefault).toHaveBeenCalled()

			const dragLeaveEvent = new Event('dragleave') as DragEvent
			targetElement.dispatchEvent(dragLeaveEvent)

			expect(cleanupHoverFn).toHaveBeenCalled()
		})

		it('dragging should handle false explicitly to reject drops', () => {
			cleanupDrag = drag(element, 'payload')
			element.dispatchEvent(new Event('dragstart') as DragEvent)

			const draggingCallback = vi.fn().mockReturnValue(false)
			cleanupDragging = dragging(targetElement, draggingCallback)

			const dragEnterEvent = new Event('dragenter') as DragEvent
			dragEnterEvent.preventDefault = vi.fn()
			targetElement.dispatchEvent(dragEnterEvent)

			// It shouldn't prevent default, because we returned false
			expect(dragEnterEvent.preventDefault).not.toHaveBeenCalled()

			// Over shouldn't prevent either
			const dragOverEvent = new Event('dragover') as DragEvent
			dragOverEvent.preventDefault = vi.fn()
			targetElement.dispatchEvent(dragOverEvent)

			expect(dragOverEvent.preventDefault).not.toHaveBeenCalled()
		})

		it('dragging should supply false to callback if no cleanup returned', () => {
			cleanupDrag = drag(element, 'payload')
			element.dispatchEvent(new Event('dragstart') as DragEvent)

			const draggingCallback = vi.fn().mockReturnValue(undefined)
			cleanupDragging = dragging(targetElement, draggingCallback)

			targetElement.dispatchEvent(new Event('dragenter') as DragEvent)
			expect(draggingCallback).toHaveBeenCalledWith('payload', true, targetElement)

			targetElement.dispatchEvent(new Event('dragleave') as DragEvent)
			expect(draggingCallback).toHaveBeenCalledWith('payload', false, targetElement)
		})

		it('dragging should handle drop event as leave for cleanup', () => {
			cleanupDrag = drag(element, 'payload')
			element.dispatchEvent(new Event('dragstart') as DragEvent)

			const cleanupHoverFn = vi.fn()
			const draggingCallback = vi.fn().mockReturnValue(cleanupHoverFn)
			cleanupDragging = dragging(targetElement, draggingCallback)

			targetElement.dispatchEvent(new Event('dragenter') as DragEvent)
			targetElement.dispatchEvent(new Event('drop') as DragEvent)

			expect(cleanupHoverFn).toHaveBeenCalled()
		})
	})
})

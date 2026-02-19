/**
 * Test directive functionality
 */

import { document } from '@pounce/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetAdapter, setAdapter } from '../../src/adapter/registry'
import { vanillaAdapter } from '../../src/adapter/vanilla'
import { type BadgeInput, type BadgeOptions, badge } from './badge'
import { type IntersectOptions, intersect } from './intersect'
import { type PointerState, pointer } from './pointer'
import { resize } from './resize'
import { scroll } from './scroll'
import { trail } from './trail'

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
      cleanup = pointer(element, state, {})

      // Simulate pointer move by directly calling the handler through dispatch
      // Note: offsetX/Y are read-only in PointerEvent, so we test the handler setup
      const moveEvent = new PointerEvent('pointermove')
      // Override offsetX/Y on the event object for testing
      Object.defineProperty(moveEvent, 'offsetX', { value: 50 })
      Object.defineProperty(moveEvent, 'offsetY', { value: 75 })
      Object.defineProperty(moveEvent, 'buttons', { value: 0 })
      element.dispatchEvent(moveEvent)

      expect(state.value).toEqual({ x: 50, y: 75, buttons: 0 })
    })

    it('should handle pointer leave', () => {
      const state = { value: { x: 10, y: 20, buttons: 0 } as PointerState | undefined }
      cleanup = pointer(element, state, {})

      // Simulate pointer leave
      const leaveEvent = new PointerEvent('pointerleave')
      element.dispatchEvent(leaveEvent)

      expect(state.value).toBeUndefined()
    })

    it('should return cleanup function', () => {
      const result = pointer(element, {}, {})
      expect(typeof result).toBe('function')
      result?.()
    })

    it('should handle non-HTMLElement target', () => {
      const textNode = document.createTextNode('text')
      const result = pointer(textNode, {}, {})
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
      cleanup = resize(element, state, {})
      expect(ResizeObserver).toHaveBeenCalled()
    })

    it('should return cleanup function', () => {
      const result = resize(element, {}, {})
      expect(typeof result).toBe('function')
      result?.()
    })

    it('should handle non-HTMLElement target', () => {
      const textNode = document.createTextNode('text')
      const result = resize(textNode, {}, {})
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
      cleanup = scroll(element, value, {})
      expect(element.scrollLeft).toBe(50)
      expect(element.scrollTop).toBe(100)
    })

    it('should return cleanup function', () => {
      const result = scroll(element, {}, {})
      expect(typeof result).toBe('function')
      result?.()
    })

    it('should handle non-HTMLElement target', () => {
      const textNode = document.createTextNode('text')
      const result = scroll(textNode, {}, {})
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
      cleanup = intersect(element, options, {})
      expect(IntersectionObserver).toHaveBeenCalledWith(expect.any(Function), {
        root: null,
        rootMargin: '10px',
        threshold: 0.5,
      })
    })

    it('should return cleanup function', () => {
      const result = intersect(element, {}, {})
      expect(typeof result).toBe('function')
      result?.()
    })

    it('should handle non-HTMLElement target', () => {
      const textNode = document.createTextNode('text')
      const result = intersect(textNode, {}, {})
      expect(result).toBeUndefined()
    })
  })

  describe('badge', () => {
    let element: HTMLElement
    let cleanup: (() => void) | undefined

    beforeEach(() => {
      setAdapter(vanillaAdapter)
      element = document.createElement('button')
      document.body.appendChild(element)
    })

    afterEach(() => {
      cleanup?.()
      element.remove()
      resetAdapter()
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
        variant: 'danger',
      }
      cleanup = badge(element, options)
      
      expect(element.classList.contains('pounce-badged-bottom-left')).toBe(true)
      const badgeEl = element.querySelector('.pounce-badge-floating')
      expect(badgeEl?.classList.contains('pounce-variant-danger')).toBe(true)
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

  describe('trail', () => {
    let element: HTMLElement
    let cleanup: (() => void) | undefined
    let mutationCallback: MutationCallback

    beforeEach(() => {
      element = document.createElement('div')
      document.body.appendChild(element)
      // Mock MutationObserver
      globalThis.MutationObserver = vi.fn().mockImplementation(function (callback: MutationCallback) {
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
      const result = trail(element, true, {})
      expect(typeof result).toBe('function')
      result?.()
    })

    it('should handle non-HTMLElement target', () => {
      const textNode = document.createTextNode('text')
      const result = trail(textNode, true, {})
      expect(result).toBeUndefined()
    })

    it('should be disabled when value is false', () => {
      const result = trail(element, false, {})
      expect(result).toBeUndefined()
    })

    it('should default to enabled when value is undefined', () => {
      const result = trail(element, undefined, {})
      expect(typeof result).toBe('function')
      result?.()
    })

    it('should attach scroll listener and MutationObserver', () => {
      const addSpy = vi.spyOn(element, 'addEventListener')
      cleanup = trail(element, true, {})

      expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(MutationObserver).toHaveBeenCalled()
    })

    it('should remove listeners on cleanup', () => {
      const removeSpy = vi.spyOn(element, 'removeEventListener')
      cleanup = trail(element, true, {})
      const disconnectFn = (MutationObserver as any).mock.results[0].value.disconnect

      cleanup!()
      cleanup = undefined

      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(disconnectFn).toHaveBeenCalled()
    })

    it('should accept array target', () => {
      const result = trail([element], true, {})
      expect(typeof result).toBe('function')
      result?.()
    })
  })
})

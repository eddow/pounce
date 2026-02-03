import { vi } from 'vitest'
import { setWindow } from '@pounce/core'

// Mock ResizeObserver for JSDOM (must be before setWindow)
globalThis.ResizeObserver = class ResizeObserver {
	constructor(public callback: ResizeObserverCallback) {}
	observe = vi.fn()
	unobserve = vi.fn()
	disconnect = vi.fn()
} as any

// Mock IntersectionObserver for JSDOM (must be before setWindow)
globalThis.IntersectionObserver = class IntersectionObserver {
	constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {}
	observe = vi.fn()
	unobserve = vi.fn()
	disconnect = vi.fn()
	takeRecords = vi.fn(() => [])
	root = null
	rootMargin = ''
	thresholds = []
} as any

// Initialize @pounce/core with JSDOM's window
setWindow(globalThis.window as any)

// Basic setup if needed
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(cb, 0))

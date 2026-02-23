import { atomic, biDi, effect, named, reactiveOptions, type ScopedCallback } from 'mutts'
import { type CompositeAttributes, ReactiveProp } from './composite-attributes'
import { pounceOptions, testing } from './debug'
import { classNames } from './styles'

export function isFunction(value: any): value is Function {
	return typeof value === 'function'
}

export function isNumber(value: any): value is number {
	return typeof value === 'number'
}

export function isString(value: any): value is string {
	return typeof value === 'string'
}

export function isSymbol(value: any): value is symbol {
	return typeof value === 'symbol'
}
export function isWeakKey(value: any): value is WeakKey {
	return (
		(typeof value === 'object' && value !== null) ||
		typeof value === 'symbol' ||
		typeof value === 'function'
	)
}

export function listen(
	target: EventTarget,
	type: string,
	listener: EventListener,
	options?: boolean | AddEventListenerOptions
) {
	listener = atomic(listener)
	testing.renderingEvent?.('add event listener', target, type, listener, options)
	target.addEventListener(type, listener, options)
	return () => {
		testing.renderingEvent?.('remove event listener', target, type, listener, options)
		target.removeEventListener(type, listener, options)
	}
}

// Component Hyper-Build Detection
const componentRebuildTracker = new WeakMap<Function, { count: number; startTime: number }>()

export function checkComponentRebuild(componentCtor: Function) {
	const { maxRebuildsPerWindow, rebuildWindowMs } = pounceOptions
	if (maxRebuildsPerWindow <= 0) return // Disabled

	const now = Date.now()
	let tracker = componentRebuildTracker.get(componentCtor)

	if (!tracker || now - tracker.startTime > rebuildWindowMs) {
		tracker = { count: 0, startTime: now }
		componentRebuildTracker.set(componentCtor, tracker)
	}

	tracker.count++

	if (tracker.count > maxRebuildsPerWindow) {
		reactiveOptions.warn(
			`[pounce] Component "${componentCtor.name}" rebuilt ${tracker.count} times in ${rebuildWindowMs}ms - possible infinite loop!`
		)
		// Reset to avoid spamming, then pause for debugging
		tracker.count = 0
		tracker.startTime = now
	}
}

export function setHtmlProperty(element: any, key: string, value: any): ScopedCallback | undefined {
	const normalizedKey = key.toLowerCase()
	try {
		if (normalizedKey in element) {
			const current = element[normalizedKey]
			if (typeof current === 'boolean') element[normalizedKey] = Boolean(value)
			else element[normalizedKey] = value ?? ''
			return () => delete element[normalizedKey]
		}
		if (key in element) {
			const current = element[key]
			if (typeof current === 'boolean') element[key] = Boolean(value)
			else element[key] = value ?? ''
			return () => delete element[key]
		}
	} catch {
		// Fallback to attribute assignment below
	}
	if (value === undefined || value === false) {
		testing.renderingEvent?.('remove attribute', element, normalizedKey)
		element.removeAttribute(normalizedKey)
		return
	}
	const stringValue = value === true ? '' : String(value)
	testing.renderingEvent?.('set attribute', element, normalizedKey, stringValue)
	element.setAttribute(normalizedKey, stringValue)
	return () => element.removeAttribute(normalizedKey)
}

export function applyStyleProperties(element: HTMLElement, computedStyles: Record<string, any>) {
	element.removeAttribute('style')
	testing.renderingEvent?.('assign style', element, computedStyles)
	Object.assign(element.style, computedStyles)
}

function attachAttributeValue(
	element: HTMLElement,
	key: string,
	value: any
): ScopedCallback | undefined {
	// 1. Event Listeners
	if (/^on[A-Z]/.test(key)) {
		const eventType = key.slice(2).toLowerCase()
		if (typeof value !== 'function') throw new Error('Event listeners must be functions')
		return listen(element, eventType, atomic(value))
	}

	// 2. Class
	if (key === 'class') {
		const cls = classNames(value)
		if (!cls) return
		element.className = cls
		return () => (element.className = '')
	}

	// 3. Style
	if (key === 'style') {
		element.removeAttribute('style')
		if (value && typeof value === 'object' && Object.keys(value).length > 0)
			Object.assign(element.style, value)
		return () => {
			element.removeAttribute('style')
		}
	}

	// 4. Standard Property/Attribute (One-way)
	return setHtmlProperty(element, key, value)
}

function attachAttribute(
	element: HTMLElement,
	key: string,
	value: any
): ScopedCallback | undefined {
	// Two-way Binding (BiDi) - only for ReactiveProp with explicit .set
	if (value instanceof ReactiveProp && value.set) {
		const binding = {
			get: value.get.bind(value),
			set: value.set.bind(value),
		}

		// Helper to push DOM changes back to the signal
		const provide = biDi((v) => setHtmlProperty(element, key, v), binding)

		let cleanup: ScopedCallback | undefined
		if (element.tagName === 'INPUT') {
			const input = element as HTMLInputElement
			if (input.type === 'checkbox' || input.type === 'radio') {
				if (key === 'checked') {
					cleanup = listen(element, 'input', () => provide(input.checked))
				}
			} else if (input.type === 'number' || input.type === 'range') {
				if (key === 'value') {
					cleanup = listen(element, 'input', () => provide(Number(input.value)))
				}
			} else {
				if (key === 'value') {
					cleanup = listen(element, 'input', () => provide(input.value))
				}
			}
		} else if (element.tagName === 'TEXTAREA') {
			if (key === 'value') {
				cleanup = listen(element, 'input', () => provide((element as HTMLTextAreaElement).value))
			}
		} else if (element.tagName === 'SELECT') {
			if (key === 'value') {
				const handler = () => {
					const val = (element as HTMLSelectElement).value
					console.error(`[pounce] SELECT event: val=${val}`)
					provide(val)
				}
				cleanup = listen(element, 'change', handler)
				const cleanupInput = listen(element, 'input', handler)
				const originalCleanup = cleanup
				cleanup = () => {
					originalCleanup()
					cleanupInput()
				}
				// Re-apply value after children (<option>) are typically mounted (microtask)
				queueMicrotask(() => {
					const val = binding.get()
					console.error(`[pounce] SELECT microtask: val=${val}`)
					setHtmlProperty(element, 'value', val)
				})
			}
		}

		const eff = effect(named(`attr:${key}`, () => setHtmlProperty(element, key, binding.get())))

		return () => {
			cleanup?.()
			eff?.()
		}
	}

	// One-way binding/setter
	return value instanceof ReactiveProp
		? effect(named(`attr:${key}:setter`, () => attachAttributeValue(element, key, value.get())))
		: attachAttributeValue(element, key, value)
}

export function attachAttributes(
	element: HTMLElement,
	attributes: CompositeAttributes
): ScopedCallback | undefined {
	const cleanups: Record<string, ScopedCallback | undefined> = {}
	const cleanAll = () => {
		for (const cleanup of Object.values(cleanups)) cleanup?.()
	}
	attributes.mask('class')
	attributes.mask('style')

	cleanups.class = attributes.requiresEffect('class')
		? attachAttribute(element, 'class', new ReactiveProp(() => attributes.mergeClasses()))
		: attachAttributeValue(element, 'class', attributes.mergeClasses())
	cleanups.style = attributes.requiresEffect('style')
		? attachAttribute(element, 'style', new ReactiveProp(() => attributes.mergeStyles()))
		: attachAttributeValue(element, 'style', attributes.mergeStyles())

	if (attributes.isReactive) {
		const stop = effect.named('attrs:update')(() => {
			const newKeys = attributes.keys
			for (const key of newKeys)
				if (!(key in cleanups)) cleanups[key] = attachAttribute(element, key, attributes.get(key))
			for (const key in cleanups) {
				if (key === 'class' || key === 'style') continue
				if (!newKeys.has(key)) {
					cleanups[key]?.()
					delete cleanups[key]
				}
			}
		})
		return () => {
			stop()
			cleanAll()
		}
	} else
		for (const key of attributes.keys)
			cleanups[key] = attachAttribute(element, key, attributes.get(key))

	return cleanAll
}

import { pounceOptions, testing } from './debug'
import { ReactiveProp } from './jsx-factory'

export function isFunction(value: any): value is Function {
	return typeof value === 'function'
}

export function isNumber(value: any): value is number {
	return typeof value === 'number'
}

export function isObject(value: any): value is object {
	return typeof value === 'object' && value !== null
}

export function isString(value: any): value is string {
	return typeof value === 'string'
}

export function isSymbol(value: any): value is symbol {
	return typeof value === 'symbol'
}

export function listen(
	target: EventTarget,
	type: string,
	listener: EventListenerOrEventListenerObject,
	options?: boolean | AddEventListenerOptions
) {
	testing.renderingEvent?.('add event listener', target, type, listener, options)
	target.addEventListener(type, listener, options)
	return () => {
		testing.renderingEvent?.('remove event listener', target, type, listener, options)
		target.removeEventListener(type, listener, options)
	}
}

export function valuedAttributeGetter(to: any) {
	if (to instanceof ReactiveProp) return to.get
	if (to === true) return () => true
	return () => to
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
		console.error(
			`[pounce] Component "${componentCtor.name}" rebuilt ${tracker.count} times in ${rebuildWindowMs}ms - possible infinite loop!`
		)
		// Reset to avoid spamming, then pause for debugging
		tracker.count = 0
		tracker.startTime = now
		debugger
	}
}

export function setHtmlProperty(element: any, key: string, value: any) {
	const normalizedKey = key.toLowerCase()
	try {
		if (normalizedKey in element) {
			const current = (element as any)[normalizedKey]
			if (typeof current === 'boolean') (element as any)[normalizedKey] = Boolean(value)
			else (element as any)[normalizedKey] = value ?? ''
			return
		}
		if (key in element) {
			const current = (element as any)[key]
			if (typeof current === 'boolean') (element as any)[key] = Boolean(value)
			else (element as any)[key] = value ?? ''
			return
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
}

export function applyStyleProperties(element: HTMLElement, computedStyles: Record<string, any>) {
	element.removeAttribute('style')
	testing.renderingEvent?.('assign style', element, computedStyles)
	Object.assign(element.style, computedStyles)
}

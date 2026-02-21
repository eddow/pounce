// TODO: Hungry dog
import { Fragment, h, latch } from '@pounce/core'
import { atomic, isObject } from 'mutts'

//#region Shared helper ─────────────────────────────────────────────────────────────

function resolveElement(target: Node | Node[]): HTMLElement | undefined {
	const el = Array.isArray(target) ? target[0] : target
	return el instanceof HTMLElement ? el : undefined
}

//#endregion
//#region resize ────────────────────────────────────────────────────────────────────

export type ResizeValue =
	| ((width: number, height: number) => void)
	| (() => { width?: number; height?: number })
	| { width?: number; height?: number }

/**
 * `use:resize` directive — observes element size via ResizeObserver.
 *
 * Value shapes:
 * - `(w, h) => void` — callback
 * - `() => { width, height }` — getter returning a reactive object to write into
 * - `{ width, height }` — reactive object written directly
 *
 * @example
 * ```tsx
 * const size = reactive({ width: 0, height: 0 })
 * <div use:resize={size} />
 * ```
 */
export function resize(target: Node | Node[], value: ResizeValue): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const observer = new ResizeObserver(
		atomic((entries: ResizeObserverEntry[]) => {
			const entry = entries[0]
			if (!entry) return
			let width: number
			let height: number
			if (entry.borderBoxSize && entry.borderBoxSize.length > 0) {
				width = Math.round(entry.borderBoxSize[0]!.inlineSize)
				height = Math.round(entry.borderBoxSize[0]!.blockSize)
			} else {
				width = Math.round(entry.contentRect.width)
				height = Math.round(entry.contentRect.height)
			}

			if (typeof value === 'function') {
				if (value.length >= 2) {
					;(value as (w: number, h: number) => void)(width, height)
				} else {
					const next = (value as () => { width?: number; height?: number })()
					if (next && typeof next === 'object') {
						next.width = width
						next.height = height
					}
				}
			} else if (value && typeof value === 'object') {
				if (typeof width === 'number' && !Number.isNaN(width) && value.width !== width)
					value.width = width
				if (typeof height === 'number' && !Number.isNaN(height) && value.height !== height)
					value.height = height
			}
		})
	)
	observer.observe(element)
	return () => observer.disconnect()
}

//#endregion
//#region scroll ────────────────────────────────────────────────────────────────────

export type ScrollAxis = number | { value: number; max?: number }

export type ScrollOptions = {
	x?: ScrollAxis
	y?: ScrollAxis
}

/**
 * `use:scroll` directive — tracks and optionally controls scroll position.
 *
 * @example
 * ```tsx
 * const pos = reactive({ x: { value: 0, max: 0 }, y: { value: 0, max: 0 } })
 * <div use:scroll={pos} style="overflow: auto" />
 * ```
 */
export function scroll(target: Node | Node[], value: ScrollOptions): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	if (value.x !== undefined) {
		if (typeof value.x === 'number') element.scrollLeft = value.x
	}
	if (value.y !== undefined) {
		if (typeof value.y === 'number') element.scrollTop = value.y
	}

	const updateMax = () => {
		if (isObject(value.x) && 'max' in value.x) {
			const max = element.scrollWidth - element.clientWidth
			if ((value.x as { max?: number }).max !== max) {
				;(value.x as { max?: number }).max = max
			}
		}
		if (isObject(value.y) && 'max' in value.y) {
			const max = element.scrollHeight - element.clientHeight
			if ((value.y as { max?: number }).max !== max) {
				;(value.y as { max?: number }).max = max
			}
		}
	}

	const handleScroll = atomic(() => {
		const x = element.scrollLeft
		const y = element.scrollTop
		if (isObject(value.x) && 'value' in value.x && (value.x as { value: number }).value !== x) {
			;(value.x as { value: number }).value = x
		}
		if (isObject(value.y) && 'value' in value.y && (value.y as { value: number }).value !== y) {
			;(value.y as { value: number }).value = y
		}
	})

	const resizeObserver = new ResizeObserver(atomic(updateMax))
	element.addEventListener('scroll', handleScroll)
	resizeObserver.observe(element)
	updateMax()

	return () => {
		element.removeEventListener('scroll', handleScroll)
		resizeObserver.disconnect()
	}
}

//#endregion
//#region intersect ─────────────────────────────────────────────────────────────────

export type IntersectOptions = {
	onEnter?: (entry: IntersectionObserverEntry) => void
	onLeave?: (entry: IntersectionObserverEntry) => void
	onChange?: (entry: IntersectionObserverEntry) => void
	root?: HTMLElement | null
	rootMargin?: string
	threshold?: number | number[]
}

/**
 * `use:intersect` directive — IntersectionObserver wrapper.
 *
 * @example
 * ```tsx
 * <div use:intersect={{ onEnter: () => load() }} />
 * ```
 */
export function intersect(
	target: Node | Node[],
	value: IntersectOptions
): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				value.onChange?.(entry)
				if (entry.isIntersecting) value.onEnter?.(entry)
				else value.onLeave?.(entry)
			}
		},
		{
			root: value.root ?? null,
			rootMargin: value.rootMargin ?? '0px',
			threshold: value.threshold ?? 0,
		}
	)
	observer.observe(element)
	return () => observer.disconnect()
}

//#endregion
//#region loading ───────────────────────────────────────────────────────────────────

const FORM_ELEMENTS = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'FIELDSET'])

/**
 * `use:loading` directive — sets `aria-busy`, disables form elements, suppresses pointer events.
 *
 * The adapter can add a CSS class for visual spinner; the directive itself only manages
 * `aria-busy` and `disabled`. Pass `loadingClass` to also toggle a CSS class.
 *
 * @example
 * ```tsx
 * <button use:loading={saving}>Submit</button>
 * ```
 */
export function loading(
	target: Node | Node[],
	value: boolean,
	_scope?: Record<PropertyKey, unknown>,
	loadingClass?: string
): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const isFormEl = FORM_ELEMENTS.has(element.tagName)
	const wasDisabled = isFormEl && (element as HTMLButtonElement).disabled

	const apply = (active: boolean) => {
		if (active) {
			element.setAttribute('aria-busy', 'true')
			if (loadingClass) element.classList.add(loadingClass)
			if (isFormEl) {
				;(element as HTMLButtonElement).disabled = true
			}
		} else {
			element.removeAttribute('aria-busy')
			if (loadingClass) element.classList.remove(loadingClass)
			if (isFormEl) {
				;(element as HTMLButtonElement).disabled = wasDisabled
			}
		}
	}

	apply(value)
	return () => apply(false)
}

//#endregion
//#region pointer ───────────────────────────────────────────────────────────────────

export type PointerState = {
	x: number
	y: number
	buttons: number
}

export type PointerBinding = { value: PointerState | undefined }

/**
 * `use:pointer` directive — tracks pointer position and button state.
 *
 * @example
 * ```tsx
 * const ptr = reactive({ value: undefined as PointerState | undefined })
 * <div use:pointer={ptr} />
 * ```
 */
export function pointer(target: Node | Node[], value: PointerBinding): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const handleMove = (e: PointerEvent) => {
		value.value = { x: e.offsetX, y: e.offsetY, buttons: e.buttons }
	}
	const handleLeave = () => {
		value.value = undefined
	}
	const handleDown = (e: PointerEvent) => {
		element.setPointerCapture(e.pointerId)
		handleMove(e)
	}
	const handleUp = (e: PointerEvent) => {
		element.releasePointerCapture(e.pointerId)
		handleMove(e)
	}

	element.addEventListener('pointermove', handleMove)
	element.addEventListener('pointerdown', handleDown)
	element.addEventListener('pointerup', handleUp)
	element.addEventListener('pointerleave', handleLeave)

	return () => {
		element.removeEventListener('pointermove', handleMove)
		element.removeEventListener('pointerdown', handleDown)
		element.removeEventListener('pointerup', handleUp)
		element.removeEventListener('pointerleave', handleLeave)
	}
}

//#endregion
//#region badge (floating) ──────────────────────────────────────────────────────────

export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

export type FloatingBadgeOptions = {
	value: string | number | JSX.Element
	position?: BadgePosition
	class?: string
}

export type FloatingBadgeInput = string | number | JSX.Element | FloatingBadgeOptions

function isFloatingBadgeOptions(input: FloatingBadgeInput): input is FloatingBadgeOptions {
	return (
		typeof input === 'object' &&
		input !== null &&
		'value' in (input as object) &&
		!('render' in (input as object))
	)
}

/**
 * `use:floatingBadge` directive — renders a floating badge overlay on any element.
 *
 * @example
 * ```tsx
 * <button use:floatingBadge={3} />
 * <button use:floatingBadge={{ value: 'New', position: 'top-left' }} />
 * ```
 */
export function floatingBadge(
	target: Node | Node[],
	input: FloatingBadgeInput
): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const options: FloatingBadgeOptions = isFloatingBadgeOptions(input) ? input : { value: input }
	const position = options.position ?? 'top-right'

	element.classList.add('pounce-badged', `pounce-badged-${position}`)

	const badgeEl = document.createElement('span')
	badgeEl.className = 'pounce-badge-floating'
	if (options.class) {
		for (const cls of options.class.split(' ')) {
			if (cls) badgeEl.classList.add(cls)
		}
	}
	badgeEl.setAttribute('aria-hidden', 'true')
	element.appendChild(badgeEl)

	const content = options.value
	const jsxContent =
		typeof content === 'object' && content !== null && 'render' in content
			? (content as JSX.Element)
			: (h(Fragment, {}, String(content)) as JSX.Element)
	const unbind = latch(badgeEl, jsxContent)

	return () => {
		if (typeof unbind === 'function') unbind()
		badgeEl.remove()
		element.classList.remove('pounce-badged', `pounce-badged-${position}`)
	}
}

//#endregion
//#region tail ─────────────────────────────────────────────────────────────────────

/**
 * `use:tail` directive — keeps a scrollable container pinned to the bottom
 * as content grows, unless the user scrolls away. Re-engages when the user
 * scrolls back to the bottom.
 *
 * @example
 * ```tsx
 * <div use:tail style="overflow-y: auto; height: 300px">
 *   <for each={messages}>{(msg) => <p>{msg.text}</p>}</for>
 * </div>
 * ```
 */
export function tail(target: Node | Node[], value?: boolean): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return
	if (value === false) return

	const THRESHOLD = 30
	let trailing = true

	const isAtBottom = () =>
		element.scrollHeight - element.scrollTop - element.clientHeight < THRESHOLD

	const onScroll = () => {
		trailing = isAtBottom()
	}

	const scrollToEnd = () => {
		if (trailing) element.scrollTop = element.scrollHeight
	}

	const observer = new MutationObserver(() => {
		requestAnimationFrame(scrollToEnd)
	})

	element.addEventListener('scroll', onScroll)
	observer.observe(element, { childList: true, subtree: true })

	return () => {
		element.removeEventListener('scroll', onScroll)
		observer.disconnect()
	}
}

//#endregion

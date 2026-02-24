import { collapse, type PerhapsReactive, ReactiveProp } from '@pounce/core'
import { resolveElement } from './shared'

type Direction = 'horizontal' | 'vertical'
type Edge = 'left' | 'right' | 'top' | 'bottom'

function detectDirection(parent: HTMLElement): Direction {
	const computed = getComputedStyle(parent)
	const display = computed.display || parent.style.display
	if (display === 'flex' || display === 'inline-flex') {
		const dir = computed.flexDirection || parent.style.flexDirection || 'row'
		return dir === 'column' || dir === 'column-reverse' ? 'vertical' : 'horizontal'
	}
	return 'horizontal'
}

function findFlexSibling(element: HTMLElement, siblings: HTMLElement[]): HTMLElement | null {
	const flexSiblings = siblings.filter((s) => {
		if (s === element) return false
		const computed = getComputedStyle(s)
		return computed.flex === '1 1 0%' || computed.flex === '1' || computed.flexGrow === '1'
	})
	if (flexSiblings.length !== 1) {
		console.warn('use:sizeable requires exactly one flex:1 sibling')
		return null
	}
	return flexSiblings[0]
}

function detectEdge(
	element: HTMLElement,
	siblings: HTMLElement[],
	flexSibling: HTMLElement,
	direction: Direction
): Edge {
	const elementIndex = siblings.indexOf(element)
	const siblingIndex = siblings.indexOf(flexSibling)
	if (direction === 'horizontal') {
		return elementIndex < siblingIndex ? 'right' : 'left'
	} else {
		return elementIndex < siblingIndex ? 'bottom' : 'top'
	}
}

function getCursor(edge: Edge): string {
	return edge === 'left' || edge === 'right' ? 'col-resize' : 'row-resize'
}

function getProperty(direction: Direction): string {
	return direction === 'horizontal' ? '--sizeable-width' : '--sizeable-height'
}

// TODO: Not at all a perhapsReactive: should be a reactive object
export function sizeable(target: Node | readonly Node[], value: PerhapsReactive<number>) {
	const el = resolveElement(target as Node | Node[])
	if (!el) return
	const element: HTMLElement = el
	const parent = element.parentElement
	if (!parent) {
		console.warn('use:sizeable requires a parent element')
		return
	}

	const siblings = Array.from(parent.children) as HTMLElement[]
	const flexSibling = findFlexSibling(element, siblings)
	if (!flexSibling) return

	const direction = detectDirection(parent)
	const edge = detectEdge(element, siblings, flexSibling, direction)
	const property = getProperty(direction)

	// Unwrap to ReactiveProp if needed
	const prop = value instanceof ReactiveProp ? value : null

	// Initialize CSS variable from current value
	const initialSize = collapse(value)
	parent.style.setProperty(property, `${initialSize}px`)

	element.classList.add('sizeable', `sizeable-${edge}`)

	const handle = document.createElement('div')
	handle.className = `sizeable-handle sizeable-handle-${edge}`
	handle.style.cursor = getCursor(edge)

	const parentStyle = getComputedStyle(parent)
	if (parentStyle.position === 'static') parent.style.position = 'relative'

	element.appendChild(handle)

	let startPos = 0
	let startSize = 0

	function onMouseDown(e: MouseEvent) {
		e.preventDefault()
		e.stopPropagation()
		startPos = direction === 'horizontal' ? e.clientX : e.clientY
		startSize = direction === 'horizontal' ? element.offsetWidth : element.offsetHeight
		document.addEventListener('mousemove', onMouseMove)
		document.addEventListener('mouseup', onMouseUp)
		handle.classList.add('dragging')
		element.classList.add('dragging')
	}

	function onMouseMove(e: MouseEvent) {
		let delta = (direction === 'horizontal' ? e.clientX : e.clientY) - startPos
		if (edge === 'left' || edge === 'top') delta = -delta
		const newSize = startSize + delta
		// CSS clamp() on the parent handles min/max — just set the variable
		parent!.style.setProperty(property, `${newSize}px`)
		prop?.set?.(newSize)
	}

	function onMouseUp() {
		document.removeEventListener('mousemove', onMouseMove)
		document.removeEventListener('mouseup', onMouseUp)
		handle.classList.remove('dragging')
		element.classList.remove('dragging')
	}

	handle.addEventListener('mousedown', onMouseDown)

	return () => {
		handle.removeEventListener('mousedown', onMouseDown)
		handle.remove()
		element.classList.remove('sizeable', `sizeable-${edge}`, 'dragging')
	}
}

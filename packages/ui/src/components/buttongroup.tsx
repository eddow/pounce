import { defaults } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { getAdapter } from '../adapter/registry'

componentStyle.sass`
.pounce-buttongroup
	display: inline-flex
	align-items: stretch
	width: fit-content
	flex: none

	&.pounce-buttongroup-horizontal
		flex-direction: row

	&.pounce-buttongroup-vertical
		flex-direction: column

	> *
		margin: 0

	&.pounce-buttongroup-horizontal > button:not(:last-child)
		border-top-right-radius: 0
		border-bottom-right-radius: 0
		border-right: none

	&.pounce-buttongroup-horizontal > button:not(:first-child)
		border-top-left-radius: 0
		border-bottom-left-radius: 0

	&.pounce-buttongroup-vertical > button:not(:last-child)
		border-bottom-left-radius: 0
		border-bottom-right-radius: 0
		border-bottom: none

	&.pounce-buttongroup-vertical > button:not(:first-child)
		border-top-left-radius: 0
		border-top-right-radius: 0

.pounce-buttongroup button:focus-visible,
.pounce-toolbar button:focus-visible
	outline: 2px solid var(--pounce-primary, #3b82f6)
	outline-offset: -2px
	z-index: 1
	position: relative
`

// Global keyboard handler for button group navigation
let globalHandlerSetup = false

function setupGlobalHandler() {
	if (globalHandlerSetup) return
	globalHandlerSetup = true

	document.addEventListener('keydown', (e: KeyboardEvent) => {
		if (e.key !== 'Tab') return

		const target = e.target as HTMLElement
		const button = target.closest('button') as HTMLButtonElement | null
		if (!button) return
		if (button.closest('dialog[open], .pounce-drawer, .pounce-overlay')) return

		const groupContainer = button.closest(
			'.pounce-buttongroup, .pounce-toolbar'
		) as HTMLElement | null
		if (!groupContainer) return

		const toolbarAncestor = button.closest('.pounce-toolbar') as HTMLElement | null

		e.preventDefault()
		const isShiftTab = e.shiftKey
		const cycleToolbar = (
			toolbarAncestor && toolbarAncestor.dataset.trapTab === 'true'
				? toolbarAncestor
				: groupContainer.classList.contains('pounce-toolbar') &&
					(groupContainer as HTMLElement).dataset.trapTab === 'true'
					? groupContainer
					: null
		) as HTMLElement | null

		if (cycleToolbar) {
			const next = findNextFocusableInToolbar(cycleToolbar, button, isShiftTab)
			if (next) { next.focus(); return }
		} else if (toolbarAncestor) {
			const next = findNextFocusableInToolbarNoWrap(toolbarAncestor, button, isShiftTab)
			if (next) { next.focus(); return }
		}
		const nextFocusable = findNextFocusableOutsideGroup(groupContainer, isShiftTab)
			; (nextFocusable ?? (document.body as HTMLElement)).focus()
	})
}

function findNextFocusableOutsideGroup(groupContainer: HTMLElement, backwards: boolean): HTMLElement | null {
	const groupSelector = '.pounce-buttongroup, .pounce-toolbar'
	const allGroups = Array.from(document.querySelectorAll<HTMLElement>(groupSelector))
	const otherGroups = allGroups.filter((g) => g !== groupContainer && !groupContainer.contains(g))

	const focusableSelector = [
		'a[href]', 'button:not([disabled])', 'input:not([disabled])',
		'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
	].join(', ')
	const allFocusable = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector))
	const focusableOutsideGroup = allFocusable.filter((el) => !groupContainer.contains(el))
	if (focusableOutsideGroup.length === 0) return null

	const getGroupEntryPoint = (group: HTMLElement, first: boolean): HTMLElement | null => {
		const isRadioGroup = group.getAttribute('role') === 'radiogroup'
		const selector = isRadioGroup ? 'button[role="radio"]' : 'button'
		const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>(selector)).filter((btn) => !btn.disabled)
		if (buttons.length === 0) return null
		return first ? buttons[0] : buttons[buttons.length - 1]
	}

	const candidates: Array<{ element: HTMLElement; isGroup: boolean }> = []
	for (const group of otherGroups) {
		const firstButton = getGroupEntryPoint(group, true)
		const lastButton = getGroupEntryPoint(group, false)
		if (firstButton && firstButton === lastButton) {
			candidates.push({ element: firstButton, isGroup: true })
		} else {
			if (firstButton) candidates.push({ element: firstButton, isGroup: true })
			if (lastButton) candidates.push({ element: lastButton, isGroup: true })
		}
	}
	for (const el of focusableOutsideGroup) {
		if (!allGroups.some((g) => g.contains(el))) {
			candidates.push({ element: el, isGroup: false })
		}
	}
	if (candidates.length === 0) return null

	candidates.sort((a, b) => {
		const pos = a.element.compareDocumentPosition(b.element)
		return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
	})

	const before: typeof candidates = []
	const after: typeof candidates = []
	for (const candidate of candidates) {
		const position = candidate.element.compareDocumentPosition(groupContainer)
		if (position & Node.DOCUMENT_POSITION_FOLLOWING) before.push(candidate)
		else if (position & Node.DOCUMENT_POSITION_PRECEDING) after.push(candidate)
	}

	const preferredBefore = before.filter((c) => c.isGroup)
	const preferredAfter = after.filter((c) => c.isGroup)

	if (backwards) {
		return preferredBefore.at(-1)?.element ?? before.at(-1)?.element ?? preferredAfter.at(-1)?.element ?? after.at(-1)?.element ?? null
	}
	return preferredAfter[0]?.element ?? after[0]?.element ?? preferredBefore[0]?.element ?? before[0]?.element ?? null
}

function handleButtonGroupNavigation(e: KeyboardEvent, button: HTMLButtonElement, groupContainer: HTMLElement) {
	if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return

	const isRadioGroup = groupContainer.getAttribute('role') === 'radiogroup'
	const selector = isRadioGroup ? 'button[role="radio"]' : 'button'
	const enabledButtons = Array.from(groupContainer.querySelectorAll<HTMLButtonElement>(selector)).filter((btn) => !btn.disabled)
	if (enabledButtons.length === 0) return

	const isVertical = groupContainer.classList.contains('pounce-buttongroup-vertical') || groupContainer.classList.contains('pounce-toolbar-vertical')
	const isHorizontal = !isVertical

	if ((isHorizontal && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) ||
		(isVertical && (e.key === 'ArrowUp' || e.key === 'ArrowDown'))) {
		e.preventDefault()
		const isNext = (isHorizontal && e.key === 'ArrowRight') || (isVertical && e.key === 'ArrowDown')
		const currentIndex = enabledButtons.indexOf(button)
		if (currentIndex === -1) return
		const nextIndex = isNext
			? (currentIndex + 1 >= enabledButtons.length ? 0 : currentIndex + 1)
			: (currentIndex - 1 < 0 ? enabledButtons.length - 1 : currentIndex - 1)
		enabledButtons[nextIndex]?.focus()
	}
}

function findNextFocusableInToolbar(toolbar: HTMLElement, currentButton: HTMLButtonElement, backwards: boolean): HTMLElement | null {
	const segments = buildSegments(toolbar)
	if (segments.length === 0) return null
	let segIndex = segments.findIndex((seg) => seg.includes(currentButton))
	if (segIndex === -1) segIndex = 0
	const nextSegIndex = backwards
		? (segIndex - 1 < 0 ? segments.length - 1 : segIndex - 1)
		: (segIndex + 1 >= segments.length ? 0 : segIndex + 1)
	const targetSegment = segments[nextSegIndex]
	if (!targetSegment || targetSegment.length === 0) return null
	return backwards ? targetSegment[targetSegment.length - 1] : targetSegment[0]
}

function findNextFocusableInToolbarNoWrap(toolbar: HTMLElement, currentButton: HTMLButtonElement, backwards: boolean): HTMLElement | null {
	const segments = buildSegments(toolbar)
	if (segments.length === 0) return null
	const segIndex = segments.findIndex((seg) => seg.includes(currentButton))
	if (segIndex === -1) return null
	const nextSegIndex = backwards ? segIndex - 1 : segIndex + 1
	if (nextSegIndex < 0 || nextSegIndex >= segments.length) return null
	const targetSegment = segments[nextSegIndex]
	if (!targetSegment || targetSegment.length === 0) return null
	return backwards ? targetSegment[targetSegment.length - 1] : targetSegment[0]
}

function buildSegments(toolbar: HTMLElement): HTMLElement[][] {
	const children = Array.from(toolbar.children) as HTMLElement[]
	const segments: HTMLElement[][] = []
	let currentSegment: HTMLElement[] = []
	for (const child of children) {
		if (child.classList.contains('pounce-toolbar-spacer')) {
			if (currentSegment.length > 0) { segments.push(currentSegment); currentSegment = [] }
			continue
		}
		const childButtons = child.matches('button')
			? [child as HTMLButtonElement]
			: Array.from(child.querySelectorAll<HTMLButtonElement>('button'))
		for (const btn of childButtons) {
			if (!btn.disabled) currentSegment.push(btn)
		}
	}
	if (currentSegment.length > 0) segments.push(currentSegment)
	return segments
}

/** Returns all (optionally role-filtered) buttons inside a group/toolbar container. */
export function getGroupButtons(container: HTMLElement, filterRole?: string): HTMLButtonElement[] {
	const selector = filterRole ? `button[role="${filterRole}"]` : 'button'
	return Array.from(container.querySelectorAll(selector)) as HTMLButtonElement[]
}

// Initialize global handler when module loads
if (typeof document !== 'undefined') {
	queueMicrotask(() => setupGlobalHandler())
}

/** Props for {@link ButtonGroup}. */
export type ButtonGroupProps = {
	children?: JSX.Children
	/** Additional CSS class. */
	class?: string
	/** Inline style string. */
	style?: string
	/** Layout direction. @default 'horizontal' */
	orientation?: 'horizontal' | 'vertical'
}

/**
 * Groups buttons with shared border radius and keyboard navigation.
 *
 * Arrow keys cycle within the group; Tab exits to the next focusable element.
 * Toolbar segment cycling is supported when nested inside a `.pounce-toolbar`.
 *
 * @example
 * ```tsx
 * <ButtonGroup>
 *   <Button>A</Button>
 *   <Button>B</Button>
 * </ButtonGroup>
 * ```
 *
 * Adapter key: `ButtonGroup` (BaseAdaptation)
 */
export const ButtonGroup = (props: ButtonGroupProps) => {
	const adapter = getAdapter('ButtonGroup')
	const p = defaults(props, { orientation: 'horizontal' as const })

	return (
		<div
			class={[
				adapter.classes?.base || 'pounce-buttongroup',
				adapter.classes?.[p.orientation] || `pounce-buttongroup-${p.orientation}`,
				props.class,
			]}
			role="group"
			style={props.style}
			onKeydown={(e: KeyboardEvent) => {
				const button = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null
				if (!button) return
				handleButtonGroupNavigation(e, button, e.currentTarget as HTMLElement)
			}}
		>
			{props.children}
		</div>
	)
}

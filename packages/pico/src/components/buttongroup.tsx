/**
 * ButtonGroup provides keyboard navigation for buttons in group containers.
 * Buttons in ButtonGroup, Toolbar, or elements with role="group" can be navigated:
 * - Arrow keys: navigate within the group (wraps around)
 * - Tab/Shift+Tab: jump to the next/previous group or focusable element outside groups
 *
 * Uses DOM traversal - no need for data attributes.
 */

import { compose } from '@pounce/core'
import { css } from '@pounce/toolbox'


css`
.pp-buttongroup {
	display: inline-flex;
	align-items: stretch;
	width: fit-content;
	flex: none;
}

.pp-buttongroup-horizontal {
	flex-direction: row;
}

.pp-buttongroup-vertical {
	flex-direction: column;
}

.pp-buttongroup > * {
	margin: 0;
}

.pp-buttongroup-horizontal > button:not(:last-child) {
	border-top-right-radius: 0;
	border-bottom-right-radius: 0;
	border-right: none;
}

.pp-buttongroup-horizontal > button:not(:first-child) {
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}

.pp-buttongroup-vertical > button:not(:last-child) {
	border-bottom-left-radius: 0;
	border-bottom-right-radius: 0;
	border-bottom: none;
}

.pp-buttongroup-vertical > button:not(:first-child) {
	border-top-left-radius: 0;
	border-top-right-radius: 0;
}

.pp-buttongroup button:focus-visible,
.pp-toolbar button:focus-visible {
	outline: 2px solid var(--pico-primary, #3b82f6);
	outline-offset: -2px;
	z-index: 1;
	position: relative;
}
`

// TODO: add tests for tab&arrows navigation
// Global keyboard handler - set up once
let globalHandlerSetup = false

function setupGlobalHandler() {
	if (globalHandlerSetup) return
	globalHandlerSetup = true

	document.addEventListener('keydown', (e: KeyboardEvent) => {
		const target = e.target as HTMLElement
		const button = target.closest('button') as HTMLButtonElement | null

		if (!button) return
		// Do not override dialog focus trapping
		if (button.closest('dialog[open]')) return

		// Check if button is in a group container
		const groupContainer = button.closest(
			'.pp-buttongroup, .pp-toolbar, [role="group"], [role="radiogroup"], [role="toolbar"]'
		) as HTMLElement | null

		if (!groupContainer) return
		// Compute toolbar ancestor independently (needed when closest match is a group)
		const toolbarAncestor = button.closest('.pp-toolbar') as HTMLElement | null

		// Handle Tab: custom behavior for toolbars; otherwise jump to next/previous focusable outside group
		if (e.key === 'Tab') {
			e.preventDefault()
			const isShiftTab = e.shiftKey
			// If inside a toolbar that opts into cycling, cycle within it across segments separated by spacers
			const cycleToolbar = (
				toolbarAncestor && toolbarAncestor.dataset.trapTab === 'true'
					? toolbarAncestor
					: groupContainer.classList.contains('pp-toolbar') &&
							(groupContainer as HTMLElement).dataset.trapTab === 'true'
						? groupContainer
						: null
			) as HTMLElement | null
			if (cycleToolbar) {
				const nextInToolbar = findNextFocusableInToolbar(cycleToolbar, button, isShiftTab)
				if (nextInToolbar) {
					nextInToolbar.focus()
					return
				}
			} else if (toolbarAncestor) {
				// Not trapping tabs, but still within a toolbar: move to next/previous segment without wrap
				const nextInToolbar = findNextFocusableInToolbarNoWrap(toolbarAncestor, button, isShiftTab)
				if (nextInToolbar) {
					nextInToolbar.focus()
					return
				}
			}
			// Default behavior: move to next focusable outside the current group
			const nextFocusable = findNextFocusableOutsideGroup(groupContainer, isShiftTab)
			;(nextFocusable ?? (document.body as HTMLElement)).focus()
			return
		}

		// Handle arrow keys: navigate within the group
		handleButtonGroupNavigation(e, button, groupContainer)
	})
}

/**
 * Find the next focusable element outside a group container
 * Prioritizes navigating to the first/last button of other group containers,
 * then falls back to standalone focusable elements.
 * @param groupContainer - The group container to exit from
 * @param backwards - If true, find previous focusable; if false, find next
 */
function findNextFocusableOutsideGroup(
	groupContainer: HTMLElement,
	backwards: boolean
): HTMLElement | null {
	// Find all group containers (Toolbar, ButtonGroup, role="group", etc.)
	const groupSelector =
		'.pp-buttongroup, .pp-toolbar, [role="group"], [role="radiogroup"], [role="toolbar"]'
	const allGroups = Array.from(document.querySelectorAll<HTMLElement>(groupSelector))

	// Filter out the current group and find all other groups
	const otherGroups = allGroups.filter((g) => g !== groupContainer && !groupContainer.contains(g))

	// Get all focusable elements in the document
	const focusableSelector = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
	].join(', ')

	const allFocusable = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector))

	// Filter out elements inside the current group container
	const focusableOutsideGroup = allFocusable.filter((el) => !groupContainer.contains(el))

	if (focusableOutsideGroup.length === 0) return null

	// Helper: get first or last focusable button in a group
	const getGroupEntryPoint = (group: HTMLElement, first: boolean): HTMLElement | null => {
		const isRadioGroup = group.getAttribute('role') === 'radiogroup'
		const selector = isRadioGroup ? 'button[role="radio"]' : 'button'
		const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>(selector)).filter(
			(btn) => !btn.disabled
		)
		if (buttons.length === 0) return null
		return first ? buttons[0] : buttons[buttons.length - 1]
	}

	// Collect candidate elements: first/last buttons of other groups, and standalone focusables
	const candidates: Array<{ element: HTMLElement; isGroup: boolean }> = []

	// Add first/last buttons of other groups
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

	// Add standalone focusable elements (not in any group)
	for (const el of focusableOutsideGroup) {
		const isInAnyGroup = allGroups.some((g) => g.contains(el))
		if (!isInAnyGroup) {
			candidates.push({ element: el, isGroup: false })
		}
	}

	if (candidates.length === 0) return null

	// Sort all candidates by document order
	candidates.sort((a, b) => {
		const pos = a.element.compareDocumentPosition(b.element)
		// DOCUMENT_POSITION_FOLLOWING = 4 means a comes before b
		return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
	})

	// Find candidates before/after the current group container
	const before: Array<{ element: HTMLElement; isGroup: boolean }> = []
	const after: Array<{ element: HTMLElement; isGroup: boolean }> = []

	for (const candidate of candidates) {
		const position = candidate.element.compareDocumentPosition(groupContainer)
		// DOCUMENT_POSITION_FOLLOWING = 4 (candidate comes before group)
		// DOCUMENT_POSITION_PRECEDING = 2 (candidate comes after group)
		if (position & Node.DOCUMENT_POSITION_FOLLOWING) {
			before.push(candidate)
		} else if (position & Node.DOCUMENT_POSITION_PRECEDING) {
			after.push(candidate)
		}
	}

	// Prefer navigating to groups over standalone elements
	const preferredBefore = before.filter((c) => c.isGroup)
	const preferredAfter = after.filter((c) => c.isGroup)

	if (backwards) {
		// Return the last group before, or last standalone before, or wrap
		if (preferredBefore.length > 0) {
			return preferredBefore[preferredBefore.length - 1].element
		}
		if (before.length > 0) {
			return before[before.length - 1].element
		}
		if (preferredAfter.length > 0) {
			return preferredAfter[preferredAfter.length - 1].element
		}
		return after.length > 0 ? after[after.length - 1].element : null
	} else {
		// Return the first group after, or first standalone after, or wrap
		if (preferredAfter.length > 0) {
			return preferredAfter[0].element
		}
		if (after.length > 0) {
			return after[0].element
		}
		if (preferredBefore.length > 0) {
			return preferredBefore[0].element
		}
		return before.length > 0 ? before[0].element : null
	}
}

/**
 * Handle keyboard navigation for buttons in a group container using DOM traversal
 */
function handleButtonGroupNavigation(
	e: KeyboardEvent,
	button: HTMLButtonElement,
	groupContainer: HTMLElement
) {
	// Only handle arrow keys
	if (
		e.key !== 'ArrowLeft' &&
		e.key !== 'ArrowRight' &&
		e.key !== 'ArrowUp' &&
		e.key !== 'ArrowDown'
	) {
		return
	}

	// Find all buttons in the same container
	// For radio groups, only include radio buttons; otherwise include all buttons
	const isRadioGroup = groupContainer.getAttribute('role') === 'radiogroup'
	const selector = isRadioGroup ? 'button[role="radio"]' : 'button'

	const groupButtons = Array.from(groupContainer.querySelectorAll(selector)) as HTMLButtonElement[]

	// Filter out disabled buttons
	const enabledButtons = groupButtons.filter((btn) => !btn.disabled)

	if (enabledButtons.length === 0) return

	// Determine orientation based on container direction
	const isVertical =
		groupContainer.classList.contains('pp-buttongroup-vertical') ||
		groupContainer.classList.contains('pp-toolbar-vertical')
	const isHorizontal = !isVertical

	// Only handle if it's a navigation key in the correct direction
	if (
		(isHorizontal && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) ||
		(isVertical && (e.key === 'ArrowUp' || e.key === 'ArrowDown'))
	) {
		e.preventDefault()
		const isNext = (isHorizontal && e.key === 'ArrowRight') || (isVertical && e.key === 'ArrowDown')
		navigateToButtonInGroup(enabledButtons, button, isNext)
	}
}

/**
 * Navigate to the next/previous button in an array
 */
function navigateToButtonInGroup(
	allButtons: HTMLButtonElement[],
	currentButton: HTMLButtonElement,
	forward: boolean
) {
	const currentIndex = allButtons.indexOf(currentButton)
	if (currentIndex === -1) return

	let nextIndex: number
	if (forward) {
		nextIndex = currentIndex + 1 >= allButtons.length ? 0 : currentIndex + 1
	} else {
		nextIndex = currentIndex - 1 < 0 ? allButtons.length - 1 : currentIndex - 1
	}

	const nextButton = allButtons[nextIndex]
	if (nextButton) {
		nextButton.focus()
	}
}

/**
 * Find the next focusable element within a toolbar, cycling across logical segments
 * Segments are defined as groups of controls separated by .pp-toolbar-spacer elements.
 * When tabbing forward from the last segment, wraps to the first segment; shift+tab wraps backwards.
 */
function findNextFocusableInToolbar(
	toolbar: HTMLElement,
	currentButton: HTMLButtonElement,
	backwards: boolean
): HTMLElement | null {
	// Build segments based on direct children separated by spacers
	const children = Array.from(toolbar.children) as HTMLElement[]
	const segments: HTMLElement[][] = []
	let currentSegment: HTMLElement[] = []
	const pushSegmentIfAny = () => {
		if (currentSegment.length > 0) {
			segments.push(currentSegment)
			currentSegment = []
		}
	}
	for (const child of children) {
		if (child.classList.contains('pp-toolbar-spacer')) {
			pushSegmentIfAny()
			continue
		}
		// Collect focusable buttons within this child
		const childButtons = child.matches('button')
			? [child as HTMLButtonElement]
			: Array.from(child.querySelectorAll<HTMLButtonElement>('button'))
		for (const btn of childButtons) {
			if (!btn.disabled) currentSegment.push(btn)
		}
	}
	pushSegmentIfAny()

	if (segments.length === 0) return null

	// Determine which segment contains the current button
	let segIndex = segments.findIndex((seg) => seg.includes(currentButton))
	// If the current button is not part of any segment (unlikely), try to locate by DOM order
	if (segIndex === -1) {
		const allButtons = segments.flat()
		if (allButtons.length === 0) return null
		// Choose segment based on nearest button
		segIndex = segments.findIndex((seg) =>
			seg.length > 0 &&
			seg[0].compareDocumentPosition(currentButton) & Node.DOCUMENT_POSITION_FOLLOWING
				? true
				: seg.includes(currentButton)
		)
		if (segIndex === -1) segIndex = 0
	}

	// Compute next segment index with wrap-around
	const nextSegIndex = backwards
		? segIndex - 1 < 0
			? segments.length - 1
			: segIndex - 1
		: segIndex + 1 >= segments.length
			? 0
			: segIndex + 1

	// Choose the entry point in the target segment
	const targetSegment = segments[nextSegIndex]
	if (!targetSegment || targetSegment.length === 0) return null
	// Entry point: first enabled button when moving forward; last when moving backwards
	return backwards ? targetSegment[targetSegment.length - 1] : targetSegment[0]
}

/**
 * Same as findNextFocusableInToolbar but without wrap-around.
 * Returns null when moving past the first/last segment so callers can exit the toolbar.
 */
function findNextFocusableInToolbarNoWrap(
	toolbar: HTMLElement,
	currentButton: HTMLButtonElement,
	backwards: boolean
): HTMLElement | null {
	const children = Array.from(toolbar.children) as HTMLElement[]
	const segments: HTMLElement[][] = []
	let currentSegment: HTMLElement[] = []
	const pushSegmentIfAny = () => {
		if (currentSegment.length > 0) {
			segments.push(currentSegment)
			currentSegment = []
		}
	}
	for (const child of children) {
		if (child.classList.contains('pp-toolbar-spacer')) {
			pushSegmentIfAny()
			continue
		}
		const childButtons = child.matches('button')
			? [child as HTMLButtonElement]
			: Array.from(child.querySelectorAll<HTMLButtonElement>('button'))
		for (const btn of childButtons) {
			if (!btn.disabled) currentSegment.push(btn)
		}
	}
	pushSegmentIfAny()

	if (segments.length === 0) return null
	const segIndex = segments.findIndex((seg) => seg.includes(currentButton))
	if (segIndex === -1) return null
	const nextSegIndex = backwards ? segIndex - 1 : segIndex + 1
	if (nextSegIndex < 0 || nextSegIndex >= segments.length) return null
	const targetSegment = segments[nextSegIndex]
	if (!targetSegment || targetSegment.length === 0) return null
	return backwards ? targetSegment[targetSegment.length - 1] : targetSegment[0]
}

/**
 * Get all buttons in a group container (useful for finding related buttons)
 * @param container - The group container element (ButtonGroup, Toolbar, etc.)
 * @param filterRole - Optional role filter (e.g., 'radio' for radio buttons only)
 */
export function getGroupButtons(container: HTMLElement, filterRole?: string): HTMLButtonElement[] {
	const selector = filterRole ? `button[role="${filterRole}"]` : 'button'
	return Array.from(container.querySelectorAll(selector)) as HTMLButtonElement[]
}

// Initialize global handler when module loads
if (typeof document !== 'undefined') {
	// Use queueMicrotask to ensure DOM is ready
	queueMicrotask(() => {
		setupGlobalHandler()
	})
}

// Visual ButtonGroup component
export type ButtonGroupProps = {
	/** Group children */
	children?: JSX.Children
	/** Additional CSS classes */
	class?: string
	/** Inline styles */
	style?: string
	/** Orientation */
	orientation?: 'horizontal' | 'vertical'
}

export const ButtonGroup = (props: ButtonGroupProps) => {
	const state = compose({ orientation: 'horizontal' }, props)

	return (
		<div
			class={['pp-buttongroup', `pp-buttongroup-${state.orientation}`, state.class]}
			role="group"
			style={state.style}
		>
			{state.children}
		</div>
	)
}

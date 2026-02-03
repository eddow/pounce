import { bindApp, h, Fragment } from '@pounce/core'
import type { Variant } from '../shared/variants'
import { variantClass } from '../shared/variants'

export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

export type BadgeOptions = {
	value: string | number | JSX.Element
	position?: BadgePosition
	variant?: Variant
	class?: string
}

export type BadgeInput = string | number | JSX.Element | BadgeOptions

function isBadgeOptions(input: BadgeInput): input is BadgeOptions {
	return typeof input === 'object' && input !== null && 'value' in input && !('render' in input)
}

/**
 * A directive that adds a badge to an element.
 * Use as use:badge={value} or use:badge={{ value, position: 'top-left' }}
 */
export function badge(target: Node | Node[], input: BadgeInput) {
	const element = Array.isArray(target) ? target[0] : target
	if (!(element instanceof HTMLElement)) return

	// Parse input
	const options: BadgeOptions = isBadgeOptions(input) ? input : { value: input }

	const position = options.position ?? 'top-right'
	const variant = options.variant

	// Apply styles to host
	const originalOverflow = element.style.overflow
	element.classList.add('pounce-badged')
	element.classList.add(`pounce-badged-${position}`)

	// Create badge container
	const badgeElement = document.createElement('span')
	badgeElement.className = 'pounce-badge-floating'
	if (options.class) {
		for (const cls of options.class.split(' ')) {
			if (cls) badgeElement.classList.add(cls)
		}
	}
	if (variant) {
		const vClass = variantClass(variant)
		if (vClass) badgeElement.classList.add(vClass)
	}

	badgeElement.setAttribute('aria-hidden', 'true')
	element.appendChild(badgeElement)

	// Render content into badge
	// jsx elements need bindApp to be reactive if they contain such logic
	const content = options.value
	const unbind = bindApp(
		(typeof content === 'object' && content !== null && 'render' in content
			? content
			: (h(Fragment, {}, String(content)) as any)) as JSX.Element,
		badgeElement as HTMLElement
	)

	return () => {
		if (typeof unbind === 'function') unbind()
		badgeElement.remove()
		element.classList.remove('pounce-badged')
		element.classList.remove(`pounce-badged-${position}`)
		element.style.overflow = originalOverflow
	}
}

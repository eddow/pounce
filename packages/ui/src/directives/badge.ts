import { Fragment, h, latch } from '@pounce/core'
import { resolveElement } from './shared'

export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

export type BadgeOptions = {
	value: string | number | JSX.Element
	position?: BadgePosition
	class?: string
}

export type BadgeInput = string | number | JSX.Element | BadgeOptions

function isBadgeOptions(input: BadgeInput): input is BadgeOptions {
	return (
		typeof input === 'object' &&
		input !== null &&
		'value' in (input as object) &&
		!('render' in (input as object))
	)
}

/**
 * `use:badge` directive — renders a floating badge overlay on any element.
 *
 * @example
 * ```tsx
 * <button use:badge={3} />
 * <button use:badge={{ value: 'New', position: 'top-left' }} />
 * ```
 */
export function badge(target: Node | Node[], input: BadgeInput): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const options: BadgeOptions = isBadgeOptions(input) ? input : { value: input }
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

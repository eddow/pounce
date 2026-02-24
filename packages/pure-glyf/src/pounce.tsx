import type { JSX } from '@pounce/core'
import type { DisplayContext } from '@pounce/kit'

/**
 * Creates an iconFactory for @pounce/ui from a pure-glyf icon map.
 *
 * @param icons - Map of logical icon names to pure-glyf class strings.
 *   Keys are the names used by components (e.g. "sun", "moon", "chevron-down").
 *   Values are pure-glyf class constants (e.g. `tablerSun` from `pure-glyf/icons`).
 *
 * @example
 * ```ts
 * import { tablerSun, tablerMoon } from 'pure-glyf/icons'
 * import { createGlyfIconFactory } from 'pure-glyf/pounce'
 * import { options } from '@pounce/ui'
 *
 * options.iconFactory = createGlyfIconFactory({
 *   sun: tablerSun,
 *   moon: tablerMoon,
 * })
 * ```
 */
export function createGlyfIconFactory(
	icons: Record<string, string>
): (name: string, size: string | number | undefined, context: DisplayContext) => JSX.Element {
	return (name: string, size: string | number | undefined, _context: DisplayContext) => {
		const cls = icons[name]
		if (!cls) return <span class="pounce-icon">{name}</span>
		const fontSize = size ? (typeof size === 'number' ? `${size}px` : size) : undefined
		return <span class={cls} style={fontSize ? { fontSize } : undefined} />
	}
}

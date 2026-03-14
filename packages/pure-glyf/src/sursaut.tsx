import type { JSX } from '@sursaut/core'
import { options } from '@sursaut/ui'

/**
 * Creates a pure-glyf iconFactory for @sursaut/ui.
 * The factory renders the icon name directly as the CSS class.
 *
 * @example
 * ```ts
 * import { registerGlyfIconFactory } from 'pure-glyf/sursaut'
 * import { options } from '@sursaut/ui'
 *
 * options.iconFactory = registerGlyfIconFactory()
 * <Icon name={tablerSun} /> // renders <span class="tablerSun" />
 * ```
 */
export function registerGlyfIconFactory(): void {
	options.iconFactory = (
		name: string,
		size: string | number | undefined,
		el: JSX.GlobalHTMLAttributes,
		_context: unknown
	) => {
		const fontSize = size ? (typeof size === 'number' ? `${size}px` : size) : undefined
		return <span {...el} class={[el.class, name]} style={fontSize ? { fontSize } : undefined} />
	}
}

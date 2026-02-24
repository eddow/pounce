import type { StyleInput } from '@pounce/core'
import { perf } from '../perf'
import { client } from '../platform/shared'

// ── Types ────────────────────────────────────────────────────────────────────

export type LinkProps = JSX.IntrinsicElements['a'] & {
	/** Whether to show underline decoration. @default true */
	underline?: boolean
}

export type LinkModel = {
	/** Whether underline is shown */
	readonly style: StyleInput
	/** Click handler — intercepts internal hrefs for SPA navigation */
	readonly onClick: (event: MouseEvent) => void
	/** aria-current value — 'page' when href matches current pathname */
	readonly ariaCurrent: 'page' | undefined
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Headless link model — router-aware anchor behavior.
 *
 * Intercepts clicks on internal hrefs (starting with `/`) and uses `client.navigate()`.
 * Automatically computes `aria-current="page"` when href matches current pathname.
 *
 * @example
 * ```tsx
 * export function Link(props: LinkProps) {
 *   const model = linkModel(props)
 *   return (
 *     <a
 *       href={props.href}
 *       onClick={model.onClick}
 *       aria-current={model.ariaCurrent}
 *       style={model.underline ? undefined : { textDecoration: 'none' }}
 *       {...props.el}
 *     >
 *       {props.children}
 *     </a>
 *   )
 * }
 * ```
 */
export function linkModel(props: LinkProps): LinkModel {
	return {
		get style() {
			return props.underline !== false ? undefined : { textDecoration: 'none' }
		},
		onClick(event: MouseEvent) {
			props.onClick?.(event)
			if (!event || event.defaultPrevented) return
			const href = props.href
			if (typeof href === 'string' && href.startsWith('/')) {
				event.preventDefault()
				if (client.url.pathname !== href) {
					perf?.mark('route:click:start')
					client.navigate(href)
					perf?.mark('route:click:end')
					perf?.measure('route:click', 'route:click:start', 'route:click:end')
				}
			}
		},
		get ariaCurrent() {
			return client.url.pathname === props.href ? 'page' : undefined
		},
	}
}

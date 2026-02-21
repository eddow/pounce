// TODO: to review
// TODO: Hungry dog
// ── Types ─────────────────────────────────────────────────────────────────────

export type MenuProps = {
	summary: JSX.Children
	children?: JSX.Children
}

export type MenuItemProps = {
	href: string
	children?: JSX.Children
}

export type MenuBarProps = {
	brand?: JSX.Children
	trailing?: JSX.Children
	items: JSX.Children[]
}

export type MenuModel = {
	/** Spreadable attrs for the `<details>` element */
	readonly details: JSX.IntrinsicElements['details'] & {
		readonly onClick: (e: MouseEvent) => void
		readonly onToggle: (e: Event) => void
	}
	/** Spreadable attrs for the `<summary>` element */
	readonly summary: JSX.IntrinsicElements['summary'] & {
		readonly 'aria-haspopup': 'menu'
		readonly onClick: (e: MouseEvent) => void
	}
}

export type MenuBarModel = {
	/** Whether the desktop bar should be shown (always true — CSS handles breakpoint) */
	readonly hasDesktopBar: boolean
}

// ── A11y helpers ──────────────────────────────────────────────────────────────

function reportA11yIssue(message: string): void {
	const strict = (globalThis as { PounceA11y?: { STRICT?: boolean } }).PounceA11y?.STRICT === true
	const prefix = '[@pounce/ui/menu a11y]'
	if (strict) throw new Error(`${prefix} ${message}`)
	console.warn(`${prefix} ${message}`)
}

function checkMenuStructure(detailsEl: HTMLDetailsElement): void {
	const summary = detailsEl.querySelector('summary')
	const list = detailsEl.querySelector('ul')
	if (!summary) reportA11yIssue('Missing <summary> inside <details> for Menu.')
	if (!list) reportA11yIssue('Missing <ul> list inside Menu.')
	if (list) {
		if (list.getAttribute('role') !== 'menu') {
			reportA11yIssue('Menu list should have role="menu".')
		}
		for (const li of Array.from(list.children)) {
			if (li.getAttribute('role') !== 'none') {
				reportA11yIssue('Menu items should be wrapped in <li role="none">.')
			}
			if (!li.querySelector('a,button,[role="menuitem"]')) {
				reportA11yIssue(
					'Each menu item should contain an actionable element (anchor, button or role="menuitem").'
				)
			}
		}
	}
	if (summary?.hasAttribute('aria-expanded')) {
		summary.setAttribute('aria-expanded', String(detailsEl.open))
	}
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Headless menu (dropdown) logic.
 *
 * Uses `<details>`/`<summary>` semantics. The adapter renders the trigger
 * (inside `<summary>`) and the item list (inside a `<ul role="menu">`).
 *
 * @example
 * ```tsx
 * const Menu = (props: MenuProps) => {
 *   const model = menuModel(props)
 *   return (
 *     <details {...model.details}>
 *       <summary {...model.summary}>{props.summary}</summary>
 *       <ul role="menu">
 *         <for each={props.items}>{(item) => <li role="none">{item}</li>}</for>
 *       </ul>
 *     </details>
 *   )
 * }
 * ```
 */
export function menuModel(_props: MenuProps): MenuModel {
	const model: MenuModel = {
		get details() {
			return {
				get onClick() {
					return (e: MouseEvent) => {
						const target = e.target as HTMLElement
						const link = target.closest('a')
						if (link) {
							const href = link.getAttribute('href')
							const targetAttr = link.getAttribute('target')
							if (!targetAttr && href && !href.startsWith('#')) {
								;(e.currentTarget as HTMLDetailsElement).removeAttribute('open')
							}
						}
					}
				},
				get onToggle() {
					return (e: Event) => {
						if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production') return
						if (e.currentTarget) checkMenuStructure(e.currentTarget as HTMLDetailsElement)
					}
				},
			}
		},
		get summary() {
			return {
				'aria-haspopup': 'menu' as const,
				get onClick() {
					return (e: MouseEvent) => {
						e.preventDefault()
						const details = (e.currentTarget as HTMLElement).closest(
							'details'
						) as HTMLDetailsElement | null
						if (details) details.open = !details.open
					}
				},
			}
		},
	}
	return model
}

/**
 * Headless menu item logic.
 *
 * Menu items are anchor elements with `role="menuitem"`.
 * The adapter renders the `<A>` or `<a>` element.
 */
export function menuItemModel(_props: MenuItemProps): Record<string, never> {
	return {}
}

/**
 * Headless menu bar logic.
 *
 * Menu bar renders a responsive toolbar with a mobile dropdown and a desktop
 * horizontal list. The adapter owns the breakpoint CSS.
 */
export function menuBarModel(_props: MenuBarProps): MenuBarModel {
	return {
		hasDesktopBar: true,
	}
}

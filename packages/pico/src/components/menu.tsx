import { effect, reactive } from 'mutts'
import { tablerOutlineMenu } from 'pure-glyf/icons'
import { css } from '@pounce/toolbox/entry-dom'
import { A } from '@pounce/toolbox/entry-dom'
import { Button } from './button'
import { Toolbar } from './toolbar'

css`
/* Responsive menu bar: desktop links vs mobile burger */
.pp-menu-bar-desktop {
	display: none;
	align-items: center;
	gap: calc(var(--pico-spacing) * 0.75);
}

nav.pp-menu-nav .pp-menu-bar-desktop ul {
	margin: 0;
	padding: 0;
}

/* Pico styles nav li/a globally; normalize inside our desktop menubar so spacing is consistent */
nav.pp-menu-nav .pp-menu-bar-desktop li {
	padding: 0;
}

nav.pp-menu-nav .pp-menu-bar-desktop a[role='menuitem'] {
	margin: 0;
	padding: 0.35rem 0.6rem;
	border-radius: 0.5rem;
	text-decoration: none;
	color: inherit;
	opacity: 0.9;
}

nav.pp-menu-nav .pp-menu-bar-desktop a[role='menuitem']:hover {
	opacity: 1;
	background: color-mix(in srgb, var(--pico-primary, #3b82f6) 12%, transparent);
}

nav.pp-menu-nav .pp-menu-bar-desktop a[role='menuitem'][aria-current='page'] {
	opacity: 1;
	color: color-mix(in srgb, var(--pico-primary, #3b82f6) 80%, black);
	background: color-mix(in srgb, var(--pico-primary, #3b82f6) 12%, transparent);
}

.pp-menu-bar-mobile {
	display: inline-flex;
	align-items: center;
}

/* Make the mobile burger summary look like just the button, not a combo */
.pp-menu-bar-mobile .dropdown > summary {
	padding: 0;
	border: none;
	background: transparent;
	height: auto;
	list-style: none;
	display: inline-flex;
	align-items: center;
}

.pp-menu-bar-mobile .dropdown > summary::-webkit-details-marker,
.pp-menu-bar-mobile .dropdown > summary::marker,
.pp-menu-bar-mobile .dropdown > summary::after {
	display: none;
}

/* Override Pico nav dropdown styling for our app menu */
nav.pp-menu-nav details.dropdown > summary:not([role]) {
	height: auto;
	padding: 0;
	border: none;
	border-radius: 0;
	background: transparent;
	color: inherit;
	box-shadow: none;
}

nav.pp-menu-nav details.dropdown > summary:not([role])::after {
	display: none;
}

/* Pico's nav uses flex layout; make our toolbar take remaining width so Toolbar.Spacer can expand */
nav.pp-menu-nav > .pp-toolbar {
	flex: 1 1 auto;
	width: 100%;
	min-width: 0;
}

/* Slightly nicer spacing for brand / groups */
nav.pp-menu-nav > .pp-toolbar > strong {
	margin-inline: 0.25rem 0.75rem;
	white-space: nowrap;
}

nav.pp-menu-nav .pp-menu-bar-mobile {
	margin-right: 0.25rem;
}

@media (min-width: 768px) {
	.pp-menu-bar-desktop {
		display: inline-flex;
	}

	.pp-menu-bar-mobile {
		display: none;
	}
}
`

export interface MenuProps {
	summary: JSX.Element | string
	children: JSX.Element | JSX.Element[]
	class?: string
}

export interface MenuItemProps {
	href: string
	children: JSX.Element | string
}

function isDevEnv(): boolean {
	// Prefer NODE_ENV when available
	if (typeof process !== 'undefined' && process.env && typeof process.env.NODE_ENV === 'string') {
		return process.env.NODE_ENV !== 'production'
	}
	// In browsers during development, assume dev when NODE_ENV is not present
	if (typeof document !== 'undefined') return true
	return true
}

interface PounceA11yGlobal {
	PounceA11y?: {
		STRICT?: boolean
	}
}

function reportA11yIssue(message: string) {
	const strict = (globalThis as PounceA11yGlobal).PounceA11y?.STRICT === true
	const prefix = '[@pounce/pico/menu a11y]'
	if (strict) throw new Error(`${prefix} ${message}`)
	console.warn(`${prefix} ${message}`)
}

function checkMenuStructure(detailsEl: HTMLDetailsElement) {
	const summary = detailsEl.querySelector('summary')
	const list = detailsEl.querySelector('ul')
	if (!summary) reportA11yIssue('Missing <summary> inside <details> for Menu.')
	if (!list) reportA11yIssue('Missing <ul> list inside Menu.')
	if (list) {
		// Validate list roles and items
		if (list.getAttribute('role') !== 'menu') {
			reportA11yIssue('Menu list should have role="menu".')
		}
		const items = Array.from(list.children)
		for (const li of items) {
			if (li.getAttribute('role') !== 'none') {
				reportA11yIssue('Menu items should be wrapped in <li role="none">.')
			}
			const actionable = li.querySelector('a,button,[role="menuitem"]')
			if (!actionable) {
				reportA11yIssue(
					'Each menu item should contain an actionable element (anchor, button or role="menuitem").'
				)
			}
		}
	}
	// Optional: reflect open state on summary aria-expanded if present
	if (summary) {
		if (summary.hasAttribute('aria-expanded')) {
			summary.setAttribute('aria-expanded', String(detailsEl.open))
		}
	}
}

const MenuList = ({ items }: { items: JSX.Element[] }) => (
	<ul role="menu">
		<for each={items}>{(item) => <li role="none">{item}</li>}</for>
	</ul>
)

const MenuComponent = (props: MenuProps) => {
	const state = reactive({
		detailsEl: undefined as HTMLDetailsElement | undefined,
	})

	// Schedule a structure check after render (dev only)
	if (isDevEnv()) {
		effect(() => {
			if (state.detailsEl) checkMenuStructure(state.detailsEl)
		})
	}
	return (
		<details
			this={state.detailsEl}
			class={props.class ?? 'dropdown'}
			onClick={(e) => {
				const target = e.target as HTMLElement
				if (target.closest('a')) {
					;(e.currentTarget as HTMLDetailsElement).removeAttribute('open')
				}
			}}
			onToggle={(e) => {
				if (!isDevEnv()) return
				checkMenuStructure(e.currentTarget as HTMLDetailsElement)
			}}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: <summary> is the interactive control for <details> */}
			<summary
				aria-haspopup="menu"
				onClick={(e) => {
					// Ensure clicks on nested elements (like our Button) still toggle the menu
					e.preventDefault()
					const details = (e.currentTarget as HTMLElement).closest('details')
					if (details) {
						details.open = !details.open
					}
				}}
			>
				{props.summary}
			</summary>
			{props.children}
		</details>
	)
}

const MenuItem = (props: MenuItemProps) => {
	return (
		<A href={props.href} role="menuitem">
			{props.children}
		</A>
	)
}

type MenuBarProps = {
	brand?: JSX.Element | string
	trailing?: JSX.Element
	items: Array<JSX.Element>
}

const MenuBar = (props: MenuBarProps) => {
	return (
		<Toolbar>
			<div class="pp-menu-bar-mobile">
				<MenuComponent
					summary={<Button icon={tablerOutlineMenu} ariaLabel="Open navigation" />}
					class="dropdown"
				>
					<MenuList items={props.items} />
				</MenuComponent>
			</div>
			<strong>{props.brand ?? 'Pounce UI'}</strong>
			<div class="pp-menu-bar-desktop">
				<MenuList items={props.items} />
			</div>
			<Toolbar.Spacer />
			{props.trailing}
		</Toolbar>
	)
}

export const Menu = Object.assign(MenuComponent, {
	Item: MenuItem,
	Bar: MenuBar,
})

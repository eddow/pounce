import { effect, reactive } from 'mutts'
import { componentStyle } from '@pounce/kit/dom'
import { A } from '@pounce/kit'
import { getAdapter } from '../adapter/registry'
import { Button } from './button'
import { Toolbar } from './toolbar'

componentStyle.sass`
.pounce-menu-bar-desktop
	display: none
	align-items: center
	gap: calc(var(--pounce-spacing, 1rem) * 0.75)

nav.pounce-menu-nav .pounce-menu-bar-desktop ul
	margin: 0
	padding: 0

nav.pounce-menu-nav .pounce-menu-bar-desktop li
	padding: 0

nav.pounce-menu-nav .pounce-menu-bar-desktop a[role='menuitem']
	margin: 0
	padding: 0.35rem 0.6rem
	border-radius: 0.5rem
	text-decoration: none
	color: inherit
	opacity: 0.9

nav.pounce-menu-nav .pounce-menu-bar-desktop a[role='menuitem']:hover
	opacity: 1
	background: color-mix(in srgb, var(--pounce-primary, #3b82f6) 12%, transparent)

nav.pounce-menu-nav .pounce-menu-bar-desktop a[role='menuitem'][aria-current='page']
	opacity: 1
	color: color-mix(in srgb, var(--pounce-primary, #3b82f6) 80%, black)
	background: color-mix(in srgb, var(--pounce-primary, #3b82f6) 12%, transparent)

.pounce-menu-bar-mobile
	display: inline-flex
	align-items: center

.pounce-menu-bar-mobile .dropdown > summary
	padding: 0
	border: none
	background: transparent
	height: auto
	list-style: none
	display: inline-flex
	align-items: center

.pounce-menu-bar-mobile .dropdown > summary::-webkit-details-marker,
.pounce-menu-bar-mobile .dropdown > summary::marker,
.pounce-menu-bar-mobile .dropdown > summary::after
	display: none

nav.pounce-menu-nav details.dropdown > summary:not([role])
	height: auto
	padding: 0
	border: none
	border-radius: 0
	background: transparent
	color: inherit
	box-shadow: none

nav.pounce-menu-nav details.dropdown > summary:not([role])::after
	display: none

nav.pounce-menu-nav > .pounce-toolbar
	flex: 1 1 auto
	width: 100%
	min-width: 0

nav.pounce-menu-nav > .pounce-toolbar > strong
	margin-inline: 0.25rem 0.75rem
	white-space: nowrap

nav.pounce-menu-nav .pounce-menu-bar-mobile
	margin-right: 0.25rem

@media (min-width: 768px)
	.pounce-menu-bar-desktop
		display: inline-flex

	.pounce-menu-bar-mobile
		display: none
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
	if (typeof process !== 'undefined' && process.env && typeof process.env.NODE_ENV === 'string') {
		return process.env.NODE_ENV !== 'production'
	}
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
	const prefix = '[@pounce/ui/menu a11y]'
	if (strict) throw new Error(`${prefix} ${message}`)
	console.warn(`${prefix} ${message}`)
}

function checkMenuStructure(detailsEl: HTMLDetailsElement) {
	const summary = detailsEl.querySelector('summary')
	const list = detailsEl.querySelector('ul')
	if (!summary) reportA11yIssue('Missing <summary> inside <details> for Menu.')
	if (!list) reportA11yIssue('Missing <ul> list inside Menu.')
	if (list) {
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
	if (summary) {
		if (summary.hasAttribute('aria-expanded')) {
			summary.setAttribute('aria-expanded', String(detailsEl.open))
		}
	}
}

const MenuList = ({ items }: { items: JSX.Element[] }) => {
	if (items.length === 0) {
		return <ul role="menu"></ul>
	}
	const state = reactive({ items })
	return (
		<ul role="menu">
			<for each={state.items}>{(item) => <li role="none">{item}</li>}</for>
		</ul>
	)
}

const MenuComponent = (props: MenuProps) => {
	const adapter = getAdapter('Menu')
	const dropdownClass = adapter?.classes?.dropdown ?? 'dropdown'

	return (
		<details
			class={props.class ?? dropdownClass}
			onClick={(e) => {
				if (!e) return
				const target = e.target as HTMLElement
				const link = target.closest('a')
				if (link) {
					const href = link.getAttribute('href')
					const targetAttr = link.getAttribute('target')
					// Only close for internal navigation (not external links or anchors)
					if (!targetAttr && href && !href.startsWith('#')) {
						;(e.currentTarget as HTMLDetailsElement).removeAttribute('open')
					}
				}
			}}
			onToggle={(e) => {
				if (!isDevEnv() || !e) return
				checkMenuStructure(e.currentTarget as HTMLDetailsElement)
			}}
		>
			<summary
				aria-haspopup="menu"
				onClick={(e) => {
					if (!e) return
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
	const adapter = getAdapter('Menu')
	const mobileClass = adapter?.classes?.barMobile ?? 'pounce-menu-bar-mobile'
	const desktopClass = adapter?.classes?.barDesktop ?? 'pounce-menu-bar-desktop'
	const dropdownClass = adapter?.classes?.dropdown ?? 'dropdown'
	const menuIcon = adapter?.icons?.menu ?? 'tabler-outline-menu'

	return (
		<Toolbar>
			<div class={mobileClass}>
				<MenuComponent
					summary={<Button icon={menuIcon} ariaLabel="Open navigation" />}
					class={dropdownClass}
				>
					<MenuList items={props.items} />
				</MenuComponent>
			</div>
			<strong>{props.brand ?? 'Pounce UI'}</strong>
			<div class={desktopClass}>
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

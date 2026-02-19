import { Menu } from '@pounce/ui'
import { ApiTable, Code, Demo, Section } from '../../components'

const menuSource = `<Menu summary="Options">
  <ul role="menu">
    <li role="none"><Menu.Item href="/settings">Settings</Menu.Item></li>
    <li role="none"><Menu.Item href="/profile">Profile</Menu.Item></li>
    <li role="none"><Menu.Item href="/logout">Logout</Menu.Item></li>
  </ul>
</Menu>`

const menuBarSource = `<Menu.Bar
  brand="My App"
  items={[
    <Menu.Item href="/">Home</Menu.Item>,
    <Menu.Item href="/about">About</Menu.Item>,
    <Menu.Item href="/docs">Docs</Menu.Item>,
  ]}
  trailing={<Button icon="settings" ariaLabel="Settings" />}
/>`

const a11yNote = `// Menu enforces a11y in dev mode:
// - <ul> must have role="menu"
// - <li> must have role="none"
// - Each item needs an actionable element (a, button, or role="menuitem")
// - summary gets aria-haspopup="menu"
//
// Set globalThis.PounceA11y = { STRICT: true } to throw on violations.`

function MenuDemo() {
	return (
		<Menu summary="Actions">
			<ul>
				<li role="none">
					<Menu.Item href="/ui/button">Buttons</Menu.Item>
				</li>
				<li role="none">
					<Menu.Item href="/ui/card">Cards</Menu.Item>
				</li>
				<li role="none">
					<Menu.Item href="/ui/forms">Forms</Menu.Item>
				</li>
			</ul>
		</Menu>
	)
}

function MenuBarDemo() {
	return (
		<nav class="pounce-menu-nav">
			<Menu.Bar
				brand="Pounce Docs"
				items={[
					<Menu.Item href="/ui/button">Button</Menu.Item>,
					<Menu.Item href="/ui/card">Card</Menu.Item>,
					<Menu.Item href="/ui/forms">Forms</Menu.Item>,
					<Menu.Item href="/ui/layout">Layout</Menu.Item>,
				]}
			/>
		</nav>
	)
}

export default function MenuPage() {
	return (
		<article>
			<h1>Menu</h1>
			<p>
				Navigation menu built on native <code>{'<details>'}</code> with a11y validation. Includes{' '}
				<code>Menu.Item</code> for links and <code>Menu.Bar</code> for responsive nav bars.
			</p>

			<Section title="Dropdown Menu">
				<p>Click the summary to toggle the dropdown. Links auto-close the menu on navigation.</p>
				<Demo title="Menu" source={menuSource} component={<MenuDemo />} />
			</Section>

			<Section title="Menu Bar">
				<p>
					Responsive navigation bar — shows a hamburger menu on mobile and inline links on desktop.
					Uses <code>Toolbar</code> internally.
				</p>
				<Demo title="Menu Bar" source={menuBarSource} component={<MenuBarDemo />} />
			</Section>

			<Section title="Accessibility">
				<p>
					Menu validates its structure in dev mode and warns about missing roles or actionable
					elements. Enable strict mode to throw errors instead of warnings.
				</p>
				<Code code={a11yNote} lang="tsx" />
			</Section>

			<Section title="API Reference">
				<h4>MenuProps</h4>
				<ApiTable
					props={[
						{
							name: 'summary',
							type: 'JSX.Element | string',
							description: 'Trigger content (rendered in <summary>)',
							required: true,
						},
						{
							name: 'children',
							type: 'JSX.Element | JSX.Element[] | string',
							description: 'Menu content — typically a <ul role="menu"> with items',
							required: true,
						},
						{
							name: 'class',
							type: 'string',
							description: 'CSS class override for the <details> wrapper',
							required: false,
						},
					]}
				/>
				<h4>Menu.Item (MenuItemProps)</h4>
				<ApiTable
					props={[
						{
							name: 'href',
							type: 'string',
							description: 'Navigation target — rendered as an <A> link with role="menuitem"',
							required: true,
						},
						{
							name: 'children',
							type: 'JSX.Element | string',
							description: 'Item label',
							required: true,
						},
					]}
				/>
				<h4>Menu.Bar (MenuBarProps)</h4>
				<ApiTable
					props={[
						{
							name: 'brand',
							type: 'JSX.Element | string',
							description: "Brand/title displayed in the toolbar. Default: 'Pounce UI'",
							required: false,
						},
						{
							name: 'items',
							type: 'Array<JSX.Element>',
							description: 'Navigation items (typically Menu.Item elements)',
							required: true,
						},
						{
							name: 'trailing',
							type: 'JSX.Element',
							description: 'Trailing content after the spacer (e.g. settings button)',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}

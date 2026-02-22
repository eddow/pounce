import { type MenuBarProps, type MenuItemProps, type MenuProps, menuModel } from '@pounce/ui/models'
import { A } from './link'

export type { MenuProps, MenuItemProps, MenuBarProps }

export function MenuItem(props: MenuItemProps) {
	return (
		<A href={props.href} role="menuitem">
			{props.children}
		</A>
	)
}

export const Menu: ((props: MenuProps) => JSX.Element) & {
	Item: (props: MenuItemProps) => JSX.Element
	Bar: (props: MenuBarProps) => JSX.Element
} = Object.assign(
	(props: MenuProps) => {
		const model = menuModel(props)
		return (
			<details {...model.details}>
				<summary {...model.summary}>{props.summary}</summary>
				{props.children}
			</details>
		)
	},
	{
		Item: MenuItem,
		Bar: (props: MenuBarProps) => {
			return (
				<nav>
					<ul>
						<li>
							<strong>{props.brand}</strong>
						</li>
					</ul>
					<ul>
						<for each={props.items}>{(item: JSX.Element) => <li>{item}</li>}</for>
					</ul>
					{props.trailing && (
						<ul>
							<li>{props.trailing}</li>
						</ul>
					)}
				</nav>
			)
		},
	}
)

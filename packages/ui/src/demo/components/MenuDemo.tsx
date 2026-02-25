import { menuModel } from '@pounce/ui'

export default function MenuDemo() {
	const model = menuModel({
		summary: 'Options',
	})

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;">
			<h2>Menu Primitive Demo</h2>
			<details {...model.details} style="position: relative; display: inline-block;">
				<summary
					{...model.summary}
					style="list-style: none; padding: 8px 16px; background: #3b82f6; border-radius: 4px; cursor: pointer; font-weight: bold;"
				>
					Actions ▾
				</summary>
				<ul
					role="menu"
					style="position: absolute; top: 100%; left: 0; margin-top: 4px; padding: 8px 0; background: #334155; border: 1px solid #475569; border-radius: 6px; list-style: none; min-width: 150px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);"
				>
					<li role="none" style="padding: 0 8px;">
						<a
							href="#edit"
							role="menuitem"
							style="display: block; padding: 8px 12px; color: white; text-decoration: none; border-radius: 4px; transition: background 0.2s;"
						>
							Edit Profile
						</a>
					</li>
					<li role="none" style="padding: 0 8px;">
						<a
							href="#settings"
							role="menuitem"
							style="display: block; padding: 8px 12px; color: white; text-decoration: none; border-radius: 4px; transition: background 0.2s;"
						>
							Settings
						</a>
					</li>
					<li style="height: 1px; background: #475569; margin: 4px 0;"></li>
					<li role="none" style="padding: 0 8px;">
						<a
							href="#logout"
							role="menuitem"
							style="display: block; padding: 8px 12px; color: #f87171; text-decoration: none; border-radius: 4px; transition: background 0.2s;"
						>
							Logout
						</a>
					</li>
				</ul>
			</details>
		</div>
	)
}

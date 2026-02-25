import { menuModel } from '@pounce/ui'

export default function MenuTests() {
	const model = menuModel({
		summary: 'Menu'
	})

	return (
		<div>
			<h1>Menu Model Tests</h1>
			<details data-testid="test-details" {...model.details}>
				<summary data-testid="test-summary" {...model.summary}>Open Menu</summary>
				<ul role="menu">
					<li role="none"><a href="#item1" role="menuitem">Item 1</a></li>
					<li role="none"><a href="#item2" role="menuitem">Item 2</a></li>
				</ul>
			</details>
		</div>
	)
}

import { createOverlayStack, drawerSpec } from '@sursaut/ui'

export default function DrawerDemo() {
	const stack = createOverlayStack()

	function openDrawer(side: 'left' | 'right') {
		stack.push(
			drawerSpec({
				title: `Drawer from ${side}`,
				side,
				children: (
					<div style="padding: 20px;">
						<p data-test="drawer-body">This is a drawer sliding from the {side}.</p>
						<button
							data-test="close-drawer"
							style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;"
							onClick={() => {
								const top = stack.stack[stack.stack.length - 1]
								if (top) top.resolve(null)
							}}
						>
							Close Drawer
						</button>
					</div>
				),
			})
		)
	}

	return (
		<div
			data-test="drawer-demo"
			style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;"
		>
			<h2>Drawer Primitive Demo</h2>
			<div style="display: flex; gap: 8px; flex-wrap: wrap;">
				<button data-test="open-drawer-left" onClick={() => openDrawer('left')}>
					Left
				</button>
				<button data-test="open-drawer-right" onClick={() => openDrawer('right')}>
					Right
				</button>
			</div>

			<for each={stack.stack}>
				{(entry) => {
					const side = entry.props?.side as 'left' | 'right' | undefined
					const title = entry.props?.title as JSX.Children
					return (
						<div
							data-test="drawer-backdrop"
							style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;"
							onClick={(e: MouseEvent) => {
								if (e.target !== e.currentTarget) return
								if (entry.dismissible !== false) entry.resolve(null)
							}}
						>
							<div
								data-test="drawer-panel"
								style={`position: absolute; background: #1e293b; color: white; transition: all 0.3s;
							${side === 'left' ? 'left: 0; top: 0; bottom: 0; width: 300px;' : ''}
							${side === 'right' ? 'right: 0; top: 0; bottom: 0; width: 300px;' : ''}
						`}
							>
								<div
									data-test="drawer-title"
									style="padding: 16px; border-bottom: 1px solid #334155; font-weight: bold;"
								>
									{title}
								</div>
								{entry.render?.(entry.resolve) ?? entry.props?.children}
							</div>
						</div>
					)
				}}
			</for>
		</div>
	)
}

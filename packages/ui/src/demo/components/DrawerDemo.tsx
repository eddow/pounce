import { createOverlayStack, drawerSpec } from '@pounce/ui'

export default function DrawerDemo() {
	const stack = createOverlayStack()

	function openDrawer(side: 'left' | 'right' | 'top' | 'bottom') {
		stack.push(
			drawerSpec({
				title: `Drawer from ${side}`,
				side,
				children: (
					<div style="padding: 20px;">
						<p>This is a drawer sliding from the {side}.</p>
						<button
							style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;"
							onClick={() => stack.pop()}
						>
							Close Drawer
						</button>
					</div>
				),
			})
		)
	}

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;">
			<h2>Drawer Primitive Demo</h2>
			<div style="display: flex; gap: 8px; flex-wrap: wrap;">
				<button onClick={() => openDrawer('left')}>Left</button>
				<button onClick={() => openDrawer('right')}>Right</button>
				<button onClick={() => openDrawer('top')}>Top</button>
				<button onClick={() => openDrawer('bottom')}>Bottom</button>
			</div>

			<for each={stack.entries}>
				{(entry) => (
					<div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;">
						<div
							style={`position: absolute; background: #1e293b; color: white; transition: all 0.3s;
							${entry.spec.side === 'left' ? 'left: 0; top: 0; bottom: 0; width: 300px;' : ''}
							${entry.spec.side === 'right' ? 'right: 0; top: 0; bottom: 0; width: 300px;' : ''}
							${entry.spec.side === 'top' ? 'top: 0; left: 0; right: 0; height: 300px;' : ''}
							${entry.spec.side === 'bottom' ? 'bottom: 0; left: 0; right: 0; height: 300px;' : ''}
						`}
						>
							<div style="padding: 16px; border-bottom: 1px solid #334155; font-weight: bold;">
								{entry.spec.title}
							</div>
							{entry.element}
						</div>
					</div>
				)}
			</for>
		</div>
	)
}

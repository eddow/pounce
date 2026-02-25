import { createOverlayStack, toastSpec } from '@pounce/ui'

export default function ToastDemo() {
	const stack = createOverlayStack()

	function notify(variant: 'info' | 'success' | 'warning' | 'error') {
		stack.push(
			toastSpec({
				message: `This is a ${variant} notification!`,
				variant,
				duration: 3000,
			})
		)
	}

	return (
		<div style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;">
			<h2>Toast Primitive Demo</h2>
			<div style="display: flex; gap: 8px; flex-wrap: wrap;">
				<button
					style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
					onClick={() => notify('info')}
				>
					Info
				</button>
				<button
					style="background: #22c55e; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
					onClick={() => notify('success')}
				>
					Success
				</button>
				<button
					style="background: #eab308; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
					onClick={() => notify('warning')}
				>
					Warning
				</button>
				<button
					style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
					onClick={() => notify('error')}
				>
					Error
				</button>
			</div>

			<div style="position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 1000;">
				<for each={stack.entries}>
					{(entry) => (
						<div
							style={`padding: 12px 16px; border-radius: 8px; color: white; min-width: 250px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
							${entry.spec.variant === 'success' ? 'background: #065f46; border: 1px solid #059669;' : ''}
							${entry.spec.variant === 'error' ? 'background: #991b1b; border: 1px solid #dc2626;' : ''}
							${entry.spec.variant === 'warning' ? 'background: #854d0e; border: 1px solid #d97706;' : ''}
							${entry.spec.variant === 'info' || !entry.spec.variant ? 'background: #1e40af; border: 1px solid #2563eb;' : ''}
						`}
						>
							<span>{entry.element}</span>
							<button
								style="background: transparent; border: none; color: white; opacity: 0.6; cursor: pointer; padding: 4px;"
								onClick={() => stack.pop()}
							>
								✕
							</button>
						</div>
					)}
				</for>
			</div>
		</div>
	)
}

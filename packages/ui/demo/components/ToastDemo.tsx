import { createOverlayStack, toastSpec } from '@sursaut/ui'

export default function ToastDemo() {
	const stack = createOverlayStack({
		transitions: {
			toast: { duration: 300 },
		},
	})

	function notify(variant: 'primary' | 'success' | 'warning' | 'danger') {
		const duration = 3000
		stack.push(
			toastSpec({
				message: `This is a ${variant} notification!`,
				variant,
				duration,
			})
		)
		const id = stack.stack[stack.stack.length - 1]?.id
		if (!id || duration <= 0) return
		setTimeout(() => {
			const entry = stack.stack.find((item) => item.id === id)
			if (entry) entry.resolve(null)
		}, duration)
	}

	return (
		<div
			data-test="toast-demo"
			style="padding: 20px; background: #1e293b; border-radius: 8px; color: white;"
		>
			<h2>Toast Primitive Demo</h2>
			<div style="display: flex; gap: 8px; flex-wrap: wrap;">
				<button
					data-test="toast-info"
					style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
					onClick={() => notify('primary')}
				>
					Info
				</button>
				<button
					data-test="toast-success"
					style="background: #22c55e; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
					onClick={() => notify('success')}
				>
					Success
				</button>
				<button
					data-test="toast-warning"
					style="background: #eab308; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
					onClick={() => notify('warning')}
				>
					Warning
				</button>
				<button
					data-test="toast-error"
					style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
					onClick={() => notify('danger')}
				>
					Error
				</button>
			</div>

			<div style="position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 1000;">
				<for each={stack.stack}>
					{(entry) => {
						const variant = entry.props?.variant
						const closing = stack.isClosing(entry.id)
						return (
							<div
								data-test="toast-item"
								data-variant={variant}
								style={`padding: 12px 16px; border-radius: 8px; color: white; min-width: 250px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
								opacity: ${closing ? 0 : 1}; transform: ${closing ? 'translateY(-12px)' : 'translateY(0)'}; transition: opacity 0.3s ease, transform 0.3s ease;
								${variant === 'success' ? 'background: #065f46; border: 1px solid #059669;' : ''}
								${variant === 'danger' ? 'background: #991b1b; border: 1px solid #dc2626;' : ''}
								${variant === 'warning' ? 'background: #854d0e; border: 1px solid #d97706;' : ''}
								${variant === 'primary' || !variant ? 'background: #1e40af; border: 1px solid #2563eb;' : ''}
							`}
							>
								<span data-test="toast-text">{entry.props?.message}</span>
								<button
									data-test="toast-dismiss"
									style="background: transparent; border: none; color: white; opacity: 0.6; cursor: pointer; padding: 4px;"
									onClick={() => entry.resolve(null)}
								>
									✕
								</button>
							</div>
						)
					}}
				</for>
			</div>
		</div>
	)
}

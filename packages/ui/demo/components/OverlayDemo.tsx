import { applyAutoFocus, createOverlayStack, dialogSpec, drawerSpec, toastSpec, trapFocus } from '@sursaut/ui'
import { reactive } from 'mutts'

export default function OverlayDemo() {
	const stack = createOverlayStack({
		transitions: {
			toast: { duration: 300 },
		},
	})
	const state = reactive({ lastResult: 'none' })
	let lastOverlayTrigger: HTMLElement | null = null

	const bindOverlaySurface = (el: HTMLElement) => {
		requestAnimationFrame(() => applyAutoFocus(el, true))
		const cleanup = trapFocus(el)
		return () => {
			cleanup()
			lastOverlayTrigger?.focus()
		}
	}

	function openDialog(e?: MouseEvent) {
		lastOverlayTrigger = (e?.currentTarget as HTMLElement | null) ?? null
		stack
			.push(
			dialogSpec({
				title: 'A Headless Dialog',
				render: (close) => (
					<div
						data-test="overlay-dialog"
						use={bindOverlaySurface}
						role="dialog"
						aria-modal="true"
						style="background: #1e293b; color: white; padding: 24px; border-radius: 12px; border: 1px solid #475569; position: relative;"
					>
						<h3 data-test="overlay-title" style="margin-top: 0;">
							Interactive Overlay
						</h3>
						<p data-test="overlay-message">This dialog is part of the Sursaut overlay stack.</p>
						<div style="display: flex; gap: 8px;">
							<button
								data-test="confirm-overlay"
								style="background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
								onClick={() => close('ok')}
							>
								Confirm
							</button>
							<button
								data-test="dismiss-overlay"
								style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;"
								onClick={() => close(null)}
							>
								Cancel
							</button>
						</div>
					</div>
				),
			})
		)
			.then((result) => {
				state.lastResult = result === null ? 'null' : String(result)
			})
	}

	function openDrawer(side: 'left' | 'right', e?: MouseEvent) {
		lastOverlayTrigger = (e?.currentTarget as HTMLElement | null) ?? null
		stack.push(
			drawerSpec({
				title: `Drawer from ${side}`,
				side,
				render: (close) => (
					<div data-test="drawer-content" style="padding: 20px;">
						<p data-test="drawer-body">This is a drawer sliding from the {side}.</p>
						<button
							data-test="drawer-secondary"
							style="background: #334155; color: white; border: 1px solid #475569; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 8px;"
						>
							Secondary Action
						</button>
						<button
							data-test="close-drawer"
							style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;"
							onClick={() => close(null)}
						>
							Close Drawer
						</button>
					</div>
				),
				children: null,
			})
		)
	}

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
		<div data-test="overlay-demo" style="padding: 20px; background: #0f172a; border-radius: 8px;">
			<h2>Overlay Primitives (Shared Stack)</h2>

			<section style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top: 12px;">
				<div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px;">
					<h3 style="margin-top: 0; margin-bottom: 8px;">Dialog</h3>
					<button
						data-test="open-overlay"
						style="background: #3b82f6; padding: 10px 14px; border: none; color: white; border-radius: 8px; font-weight: bold; cursor: pointer;"
						onClick={openDialog}
					>
						Open Dynamic Overlay
					</button>
					<p style="margin-top: 10px; color: #cbd5e1;">
						Last result: <code data-test="overlay-result">{state.lastResult}</code>
					</p>
				</div>

				<div data-test="drawer-demo" style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px;">
					<h3 style="margin-top: 0; margin-bottom: 8px;">Drawer</h3>
					<div style="display: flex; gap: 8px; flex-wrap: wrap;">
						<button data-test="open-drawer-left" onClick={(e: MouseEvent) => openDrawer('left', e)}>
							Left
						</button>
						<button data-test="open-drawer-right" onClick={(e: MouseEvent) => openDrawer('right', e)}>
							Right
						</button>
					</div>
				</div>

				<div data-test="toast-demo" style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px;">
					<h3 style="margin-top: 0; margin-bottom: 8px;">Toast</h3>
					<div style="display: flex; gap: 8px; flex-wrap: wrap;">
						<button data-test="toast-info" onClick={() => notify('primary')}>
							Info
						</button>
						<button data-test="toast-success" onClick={() => notify('success')}>
							Success
						</button>
						<button data-test="toast-warning" onClick={() => notify('warning')}>
							Warning
						</button>
						<button data-test="toast-error" onClick={() => notify('danger')}>
							Error
						</button>
					</div>
				</div>
			</section>

			<for each={stack.stack}>
				{(entry) => {
					if (entry.mode === 'toast') return null
					const side = entry.props?.side as 'left' | 'right' | undefined
					const isDrawer = entry.mode.startsWith('drawer-')
					return (
						<div
							data-test={isDrawer ? 'drawer-backdrop' : 'overlay-backdrop'}
							style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;"
							onKeydown={stack.onKeydown}
							onClick={(e: MouseEvent) => {
								if (e.target !== e.currentTarget) return
								if (entry.dismissible !== false) entry.resolve(null)
							}}
						>
							{isDrawer ? (
								<div
									data-test="drawer-panel"
									role="dialog"
									aria-modal="true"
									use={bindOverlaySurface}
									style={`position: absolute; background: #1e293b; color: white; transition: all 0.3s;
									${side === 'left' ? 'left: 0; top: 0; bottom: 0; width: 300px;' : ''}
									${side === 'right' ? 'right: 0; top: 0; bottom: 0; width: 300px;' : ''}`}
								>
									<div data-test="drawer-title" style="padding: 16px; border-bottom: 1px solid #334155; font-weight: bold;">
										{entry.props?.title}
									</div>
									{entry.render?.(entry.resolve) ?? entry.props?.children}
								</div>
							) : (
								entry.render?.(entry.resolve)
							)}
						</div>
					)
				}}
			</for>

			<div style="position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 1000;">
				<for each={stack.stack}>
					{(entry) => {
						if (entry.mode !== 'toast') return null
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
								${variant === 'primary' || !variant ? 'background: #1e40af; border: 1px solid #2563eb;' : ''}`}
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

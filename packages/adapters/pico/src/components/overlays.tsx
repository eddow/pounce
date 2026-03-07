import type { Env } from '@pounce/core'
import {
	type DialogOptions,
	type DrawerOptions,
	dialogModel,
	drawerModel,
	type OverlayEntry,
	type ToastOptions,
	toastModel,
	trapFocus,
} from '@pounce/ui'
import { type WithOverlaysProps, withOverlaysModel } from '@pounce/ui/models'

function toastCloseStyle(): string {
	return 'margin:0 0 0 auto;padding:0;border:none;background:transparent;box-shadow:none;min-width:auto;width:auto;height:auto;color:inherit;font-size:1.125rem;line-height:1;opacity:0.8;'
}

export const Dialog = (props: DialogOptions & { close: (v: unknown) => void }) => {
	const model = dialogModel(props, props.close)
	return (
		<div {...model.dialog}>
			{model.title && <div {...model.header}>{model.title}</div>}
			<div {...model.body}>{model.message}</div>
			{model.buttons.length > 0 && (
				<div {...model.footer}>
					<for each={model.buttons}>{(btn) => <button {...btn.button}>{btn.content}</button>}</for>
				</div>
			)}
		</div>
	)
}

export const Toast = (props: ToastOptions & { close: (v: unknown) => void }) => {
	const model = toastModel(props, props.close)
	return (
		<div {...model.toast}>
			<span {...model.icon} />
			<div class="pounce-toast-content">{model.message}</div>
			<button {...model.close} style={toastCloseStyle()}>
				&times;
			</button>
		</div>
	)
}

export const Drawer = (props: DrawerOptions & { close: (v: unknown) => void }) => {
	const model = drawerModel(props, props.close)
	return (
		<div {...model.drawer}>
			<div {...model.header}>
				{model.title && <div class="pounce-drawer-title">{model.title}</div>}
				<button {...model.close}>&times;</button>
			</div>
			<div {...model.body}>{props.children}</div>
			{props.footer && <div {...model.footer}>{props.footer}</div>}
		</div>
	)
}

function OverlayRenderer(props: { entry: OverlayEntry }) {
	const entry = props.entry
	const close = (v: unknown) => entry.resolve(v)

	const setupFocus = (el: HTMLElement) => {
		if (!el) return
		return trapFocus(el)
	}

	if (entry.mode === 'modal') {
		return <Dialog {...entry.props} close={close} />
	}
	if (entry.mode === 'toast') {
		entry.render?.(close)
		return <Toast {...entry.props} close={close} />
	}
	if (entry.mode === 'drawer-left' || entry.mode === 'drawer-right') {
		return <Drawer {...entry.props} close={close} />
	}

	if (entry.render) {
		return (
			<div class="pounce-overlay-custom" use={setupFocus}>
				{entry.render(close)}
			</div>
		)
	}

	return null
}

function renderOverlay(entry: OverlayEntry) {
	return <OverlayRenderer entry={entry} />
}

function renderLayer(
	stack: ReturnType<typeof withOverlaysModel>['stack'],
	model: ReturnType<typeof withOverlaysModel>,
	mode: string
) {
	const toast = mode === 'toast'
	return (
		<div
			class={['pounce-layer', `pounce-mode-${mode}`]}
			role={toast ? 'log' : undefined}
			aria-live={toast ? 'polite' : undefined}
		>
			<for each={stack.stack}>
				{(entry) =>
					entry.mode === mode ? (
						<div {...model.overlayItem(entry)}>{renderOverlay(entry)}</div>
					) : null
				}
			</for>
		</div>
	)
}

export function WithOverlays(props: WithOverlaysProps, env: Env) {
	const model = withOverlaysModel(props, env)
	return (
		<fragment>
			{props.children}
			<div {...model.manager}>
				<div
					if={model.stack.hasBackdrop}
					class="pounce-backdrop"
					onClick={model.stack.onBackdropClick}
				/>
				{props.layers ? (
					<for each={props.layers}>{(mode) => renderLayer(model.stack, model, mode)}</for>
				) : (
					<div class="pounce-layer pounce-flat">
						<for each={model.stack.stack}>
							{(entry) => <div {...model.overlayItem(entry)}>{renderOverlay(entry)}</div>}
						</for>
					</div>
				)}
			</div>
		</fragment>
	)
}

export function StandardOverlays(props: { children?: JSX.Children }, env: Env) {
	const model = withOverlaysModel(
		{ ...props, layers: ['modal', 'toast', 'drawer-left', 'drawer-right'] },
		env
	)
	return (
		<fragment>
			{props.children}
			<div {...model.manager}>
				<div
					if={model.stack.hasBackdrop}
					class="pounce-backdrop"
					onClick={model.stack.onBackdropClick}
				/>
				<for each={['modal', 'toast', 'drawer-left', 'drawer-right'] as string[]}>
					{(mode) => renderLayer(model.stack, model, mode)}
				</for>
			</div>
		</fragment>
	)
}

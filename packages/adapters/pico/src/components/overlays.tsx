import type { Env } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import {
	type DialogOptions,
	type DrawerOptions,
	dialogModel,
	drawerModel,
	type OverlayEntry,
	type ToastOptions,
	toastModel,
	trapFocus,
	type WithOverlaysProps,
	withOverlaysModel,
} from '@pounce/ui'

componentStyle.sass`
.pounce-overlay-manager
	.pounce-backdrop
		position: fixed
		inset: 0
		background: rgba(0, 0, 0, 0.5)
		pointer-events: auto
		backdrop-filter: blur(2px)

	.pounce-layer
		position: fixed
		inset: 0
		pointer-events: none
		display: flex
		
		&.pounce-mode-modal
			align-items: center
			justify-content: center
		
		&.pounce-mode-toast
			top: 1rem
			right: 1rem
			flex-direction: column
			gap: 0.5rem
		
		&.pounce-mode-drawer-left
			justify-content: flex-start
		&.pounce-mode-drawer-right
			justify-content: flex-end

		> *
			pointer-events: auto

.pounce-dialog
	background: var(--pico-background-color)
	border-radius: var(--pico-border-radius)
	padding: 1.5rem
	min-width: min(90vw, 32rem)
	max-width: 90vw
	box-shadow: 0 8px 32px rgba(0,0,0,0.2)
	
	.pounce-dialog-header
		margin-bottom: 1rem
		font-weight: bold
		font-size: 1.25rem
	
	.pounce-dialog-footer
		display: flex
		justify-content: flex-end
		gap: 0.5rem
		margin-top: 1.5rem

.pounce-toast
	padding: 0.75rem 1rem
	border-radius: var(--pico-border-radius)
	background: var(--pico-background-color)
	box-shadow: 0 4px 16px rgba(0,0,0,0.15)
	min-width: 16rem
	max-width: 28rem
	display: flex
	align-items: center
	gap: 0.75rem
	
	&.pounce-variant-success
		border-left: 4px solid var(--pico-ins-color)
	&.pounce-variant-danger
		border-left: 4px solid var(--pico-del-color)
	&.pounce-variant-warning
		border-left: 4px solid var(--pico-warning-color)
	&.pounce-variant-info
		border-left: 4px solid var(--pico-primary-color)

.pounce-drawer
	height: 100%
	width: min(80vw, 24rem)
	background: var(--pico-background-color)
	box-shadow: 0 0 24px rgba(0,0,0,0.15)
	display: flex
	flex-direction: column
	
	.pounce-drawer-header
		padding: 1rem 1.5rem
		border-bottom: 1px solid var(--pico-muted-border-color)
		display: flex
		align-items: center
		justify-content: space-between
	
	.pounce-drawer-body
		flex: 1
		overflow-y: auto
		padding: 1.5rem
	
	.pounce-drawer-footer
		padding: 1rem 1.5rem
		border-top: 1px solid var(--pico-muted-border-color)
`

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
			<button {...model.close}>&times;</button>
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

	if (entry.render) {
		return (
			<div class="pounce-overlay-custom" use={setupFocus}>
				{entry.render(close)}
			</div>
		)
	}

	if (entry.mode === 'modal') {
		return <Dialog {...entry.props} close={close} />
	}
	if (entry.mode === 'toast') {
		return <Toast {...entry.props} close={close} />
	}
	if (entry.mode === 'drawer-left' || entry.mode === 'drawer-right') {
		return <Drawer {...entry.props} close={close} />
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

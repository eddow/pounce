import type { Env } from '@pounce/core'
import { defaults } from '@pounce/core'
import {
	applyAutoFocus,
	bindDialog,
	bindDrawer,
	bindToast,
	createOverlayStack,
	type OverlayEntry,
} from '../overlays'

export interface WithOverlaysProps {
	children?: JSX.Children
	/**
	 * Names of layers to create.
	 * If provided, overlays with matching 'mode' will render in their layer.
	 * If not provided, all overlays render in a single flat layer.
	 */
	layers?: string[]
	/**
	 * Modes that should trigger a backdrop.
	 * Default: ['modal', 'drawer-left', 'drawer-right']
	 */
	backdropModes?: string[]
	/** Whether the container is fixed to viewport. Default: true. */
	fixed?: boolean
	/** Custom renderer for overlay entries. */
	renderOverlay?: (entry: OverlayEntry) => JSX.Element
}

/**
 * Generic Overlay Host Component.
 * Purely behavioral (node-less in intent, but adds the manager container).
 */
export const WithOverlays = (props: WithOverlaysProps, env: Env) => {
	const p = defaults(props, { fixed: true })
	const state = createOverlayStack({
		backdropModes: props.backdropModes,
	})

	// Expose to env
	env.overlay = state.push
	env.dialog = bindDialog(state.push)
	env.toast = bindToast(state.push)
	env.drawer = bindDrawer(state.push)

	const isModalMode = (mode: string) => mode === 'modal' || mode.startsWith('drawer')

	const renderOverlayItem = (entry: OverlayEntry) => {
		if (props.renderOverlay) return props.renderOverlay(entry)

		const modal = isModalMode(entry.mode)
		return (
			<div
				class={['pounce-overlay-item', state.isClosing(entry.id) ? 'pounce-closing' : '']}
				role={modal ? 'dialog' : undefined}
				aria-modal={modal ? 'true' : undefined}
				aria-labelledby={entry.aria?.labelledby}
				aria-describedby={entry.aria?.describedby}
				aria-label={entry.aria?.label}
				use={(el: HTMLElement) => {
					state.registerElement(entry.id, el)
					if (!entry.closing) {
						const autoFocus = entry.autoFocus ?? modal
						if (autoFocus !== false) {
							requestAnimationFrame(() => {
								applyAutoFocus(el, autoFocus)
							})
						}
					}
				}}
			>
				{entry.render?.(entry.resolve)}
			</div>
		)
	}

	const renderLayer = (mode: string) => {
		const toast = mode === 'toast'
		return (
			<div
				class={['pounce-layer', `pounce-mode-${mode}`]}
				role={toast ? 'log' : undefined}
				aria-live={toast ? 'polite' : undefined}
			>
				<for each={state.stack}>
					{(entry) => (entry.mode === mode ? renderOverlayItem(entry) : null)}
				</for>
			</div>
		)
	}

	return (
		<fragment>
			{props.children}
			<div
				class={['pounce-overlay-manager', p.fixed ? 'pounce-fixed' : 'pounce-local']}
				onKeydown={state.onKeydown}
			>
				<div if={state.hasBackdrop} class="pounce-backdrop" onClick={state.onBackdropClick} />
				{props.layers ? (
					<for each={props.layers}>{(mode) => renderLayer(mode)}</for>
				) : (
					<div class="pounce-layer pounce-flat">
						<for each={state.stack}>{(entry) => renderOverlayItem(entry)}</for>
					</div>
				)}
			</div>
		</fragment>
	)
}

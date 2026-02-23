import type { Env } from '@pounce/core'
import {
	applyAutoFocus,
	bindDialog,
	bindDrawer,
	bindToast,
	createOverlayStack,
	type OverlayEntry,
	type OverlayStackState,
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
}

export interface WithOverlaysModel {
	readonly stack: OverlayStackState
	readonly isModalMode: (mode: string) => boolean
	readonly overlayItem: (entry: OverlayEntry) => JSX.IntrinsicElements['div']
	readonly manager: JSX.IntrinsicElements['div']
}

export function withOverlaysModel(props: WithOverlaysProps, env: Env): WithOverlaysModel {
	const stack = createOverlayStack({ backdropModes: props.backdropModes })

	env.overlay = stack.push
	env.dialog = bindDialog(stack.push)
	env.toast = bindToast(stack.push)
	env.drawer = bindDrawer(stack.push)

	const isModalMode = (mode: string) => mode === 'modal' || mode.startsWith('drawer')

	const model: WithOverlaysModel = {
		stack,
		isModalMode,
		get overlayItem() {
			return (entry: OverlayEntry): JSX.IntrinsicElements['div'] => ({
				class: ['pounce-overlay-item', stack.isClosing(entry.id) ? 'pounce-closing' : ''],
				role: isModalMode(entry.mode) ? 'dialog' : undefined,
				'aria-modal': isModalMode(entry.mode) ? 'true' : undefined,
				'aria-labelledby': entry.aria?.labelledby,
				'aria-describedby': entry.aria?.describedby,
				'aria-label': entry.aria?.label,
				use: (el: HTMLElement) => {
					stack.registerElement(entry.id, el)
					if (!entry.closing) {
						const autoFocus = entry.autoFocus ?? isModalMode(entry.mode)
						if (autoFocus !== false) {
							requestAnimationFrame(() => {
								applyAutoFocus(el, autoFocus as boolean | string)
							})
						}
					}
				},
			})
		},
		get manager() {
			return {
				class: ['pounce-overlay-manager', (props.fixed ?? true) ? 'pounce-fixed' : 'pounce-local'],
				onKeydown: stack.onKeydown,
			}
		},
	}
	return model
}

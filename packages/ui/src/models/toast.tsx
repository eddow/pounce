import type { ToastOptions } from '../overlays'

type ToastVariant = NonNullable<ToastOptions['variant']> | 'info'

export interface ToastModel {
	readonly message: JSX.Children
	readonly toast: JSX.IntrinsicElements['div']
	readonly icon: JSX.IntrinsicElements['span']
	readonly close: JSX.IntrinsicElements['button']
}

export function toastModel(props: ToastOptions, close: (value: any) => void): ToastModel {
	const model: ToastModel = {
		get message() {
			return props.message
		},
		get toast() {
			const variant: ToastVariant = props.variant ?? 'info'
			return {
				role: 'status',
				'aria-live': 'polite',
				class: ['pounce-toast', `pounce-variant-${variant}`],
			}
		},
		get icon() {
			return { class: 'pounce-toast-icon' }
		},
		get close() {
			return {
				type: 'button' as const,
				class: 'pounce-toast-close',
				'aria-label': 'Close',
				get onClick() {
					return () => close(null)
				},
			}
		},
	}
	return model
}

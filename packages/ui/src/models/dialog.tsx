import type { DialogOptions } from '../overlays'

type DialogPropsWithIds = DialogOptions & { titleId?: string; descId?: string }

export interface DialogModel {
	readonly title?: JSX.Children
	readonly message?: JSX.Children
	readonly dialog: JSX.IntrinsicElements['div']
	readonly header: JSX.IntrinsicElements['div']
	readonly body: JSX.IntrinsicElements['div']
	readonly footer: JSX.IntrinsicElements['div']
	readonly buttons: {
		readonly key: string
		readonly button: JSX.IntrinsicElements['button']
		readonly content: JSX.Children
	}[]
}

export function dialogModel(props: DialogPropsWithIds, close: (value: any) => void): DialogModel {
	const model: DialogModel = {
		get title() {
			return props.title
		},
		get message() {
			return props.message
		},
		get dialog() {
			return {
				role: 'dialog',
				'aria-modal': 'true',
				class: [
					'sursaut-dialog',
					props.size ? `sursaut-size-${props.size}` : '',
					props.variant ? `sursaut-variant-${props.variant}` : '',
				],
			}
		},
		get header() {
			return { class: 'sursaut-dialog-header', id: props.titleId }
		},
		get body() {
			return { class: 'sursaut-dialog-body', id: props.descId }
		},
		get footer() {
			return { class: 'sursaut-dialog-footer' }
		},
		get buttons() {
			if (!props.buttons) return []
			return Object.entries(props.buttons).map(([key, btn]) => {
				const b = typeof btn === 'string' ? { text: btn } : btn
				return {
					key,
					content: b.text,
					get button() {
						return {
							type: 'button' as const,
							class: [
								'sursaut-btn',
								b.variant ? `sursaut-btn-${b.variant}` : 'sursaut-btn-secondary',
							],
							disabled: b.disabled,
							get onClick() {
								return (_e: MouseEvent) => {
									if (b.onClick) b.onClick()
									close(key)
								}
							},
						}
					},
				}
			})
		},
	}
	return model
}

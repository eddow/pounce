import type { DrawerOptions } from '../overlays'

type DrawerPropsWithIds = DrawerOptions & { titleId?: string }

export interface DrawerModel {
	readonly title?: JSX.Children
	readonly drawer: JSX.IntrinsicElements['div']
	readonly header: JSX.IntrinsicElements['div']
	readonly body: JSX.IntrinsicElements['div']
	readonly footer: JSX.IntrinsicElements['div']
	readonly close: JSX.IntrinsicElements['button']
}

export function drawerModel(props: DrawerPropsWithIds, close: (value: any) => void): DrawerModel {
	const model: DrawerModel = {
		get title() {
			return props.title
		},
		get drawer() {
			const side = props.side ?? 'left'
			return {
				role: 'dialog',
				'aria-modal': 'true',
				class: ['pounce-drawer', `pounce-drawer-${side}`],
			}
		},
		get header() {
			return { class: 'pounce-drawer-header', id: props.titleId }
		},
		get body() {
			return { class: 'pounce-drawer-body' }
		},
		get footer() {
			return { class: 'pounce-drawer-footer' }
		},
		get close() {
			return {
				type: 'button' as const,
				class: 'pounce-drawer-close',
				'aria-label': 'Close',
				get onClick() {
					return () => close(null)
				},
			}
		},
	}
	return model
}

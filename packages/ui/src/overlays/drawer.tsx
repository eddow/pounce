import { componentStyle } from '@pounce/kit/dom'
import { type OverlaySpec, type PushOverlayFunction } from './manager'
import { getAdapter } from '../adapter/registry'

declare module './manager' {
	interface OverlayHelpers {
		drawer: ReturnType<typeof bindDrawer>
	}
}

componentStyle.sass`
.pounce-drawer
    background: var(--pounce-bg, #ffffff)
    height: 100%
    display: flex
    flex-direction: column
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
    animation: pounce-drawer-in-left 0.3s ease-out
    
    &.pounce-drawer-right
        animation-name: pounce-drawer-in-right

    .pounce-drawer-header
        padding: 1rem 1.5rem
        border-bottom: 1px solid var(--pounce-border, #e5e7eb)
        display: flex
        align-items: center
        justify-content: space-between

        .pounce-drawer-title
            margin: 0
            font-size: 1.125rem
            font-weight: 600

        .pounce-drawer-close
            background: none
            border: none
            cursor: pointer
            opacity: 0.5
            padding: 0.25rem
            &:hover
                opacity: 1

    .pounce-drawer-body
        padding: 1.5rem
        flex: 1
        overflow-y: auto

    .pounce-drawer-footer
        padding: 1rem 1.5rem
        border-top: 1px solid var(--pounce-border, #e5e7eb)
        display: flex
        justify-content: flex-end
        gap: 0.75rem

@keyframes pounce-drawer-in-left
    from
        transform: translateX(-100%)
    to
        transform: translateX(0)

@keyframes pounce-drawer-in-right
    from
        transform: translateX(100%)
    to
        transform: translateX(0)
`

export interface DrawerOptions {
	title?: JSX.Children
	children: JSX.Children
	footer?: JSX.Children
	side?: 'left' | 'right'
	dismissible?: boolean
}

/**
 * Standard Drawer interactor.
 */
export const Drawer = {
	show: (options: DrawerOptions): OverlaySpec => {
		const side = options.side || 'left'
		const titleId = `pounce-drawer-title-${Math.random().toString(36).substr(2, 5)}`

		return {
			mode: `drawer-${side}`,
			dismissible: options.dismissible ?? true,
			autoFocus: true,
			aria: {
				labelledby: options.title ? titleId : undefined
			},
			render: (close) => {
				const adapter = getAdapter('Drawer')
				return (
					<div class={[adapter.classes?.base || 'pounce-drawer', `pounce-drawer-${side}`]}>
						<div class="pounce-drawer-header" if={options.title}>
							<h2 class="pounce-drawer-title" id={titleId}>
								{options.title}
							</h2>
							<button class="pounce-drawer-close" onClick={() => close(null)}>
								✕
							</button>
						</div>
						<div class="pounce-drawer-body">
							{options.children}
						</div>
						<div class="pounce-drawer-footer" if={options.footer}>
							{options.footer}
						</div>
					</div>
				)
			}
		}
	}
}

/**
 * Binds the drawer interactor to a specific overlay dispatcher.
 */
export function bindDrawer(push: PushOverlayFunction) {
	return (options: DrawerOptions) => push(Drawer.show(options))
}

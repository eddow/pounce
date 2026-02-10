import { componentStyle } from '@pounce/kit/dom'
import { Button } from '../components/button'
import { Icon } from '../components/icon'
import { type OverlaySpec } from './manager'
import { getVariantTrait } from '../shared/variants'
import { getAdapter } from '../adapter/registry'

declare module './manager' {
	interface OverlayHelpers {
		dialog: ReturnType<typeof bindDialog>
	}
}

componentStyle.sass`
.pounce-dialog
    background: var(--pounce-bg, #ffffff)
    border-radius: var(--pounce-border-radius, 0.75rem)
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
    width: 100%
    max-width: 32rem
    overflow: hidden
    display: flex
    flex-direction: column
    border: 1px solid var(--pounce-border, #e5e7eb)
    animation: pounce-dialog-in 0.2s ease-out
    transform-origin: center center

    &.pounce-size-sm
        max-width: 24rem
    &.pounce-size-lg
        max-width: 48rem

    header
        padding: 1.25rem
        display: flex
        align-items: center
        justify-content: space-between
        border-bottom: 1px solid var(--pounce-border, #e5e7eb)

        h3
            margin: 0
            font-size: 1.25rem
            font-weight: 600

    main
        padding: 1.25rem
        font-size: 1rem
        line-height: 1.5
        color: var(--pounce-fg, #374151)

    footer
        padding: 1rem 1.25rem
        background: var(--pounce-bg-alt, #f9fafb)
        display: flex
        justify-content: flex-end
        gap: 0.75rem
        border-top: 1px solid var(--pounce-border, #e5e7eb)

@keyframes pounce-dialog-in
    from
        opacity: 0
        transform: scale(0.95) translateY(10px)
    to
        opacity: 1
        transform: scale(1) translateY(0)
`

export interface DialogButton {
	text: string
	variant?: string
	disabled?: boolean
	onClick?: () => any
}

export interface DialogOptions {
	title?: JSX.Children
	message?: JSX.Children
	size?: 'sm' | 'md' | 'lg'
	buttons?: Record<string, string | DialogButton>
	dismissible?: boolean
	variant?: string
}

/**
 * Standard Dialog interactor.
 */
export const Dialog = {
	/**
	 * Returns an OverlaySpec for showing a dialog.
	 */
	show: (options: DialogOptions | string): OverlaySpec => {
		const opts = typeof options === 'string' ? { message: options } : options
		const titleId = `pounce-dialog-title-${Math.random().toString(36).substr(2, 5)}`
		const descId = `pounce-dialog-desc-${Math.random().toString(36).substr(2, 5)}`

		return {
			mode: 'modal',
			dismissible: opts.dismissible ?? true,
			autoFocus: true,
			aria: {
				labelledby: opts.title ? titleId : undefined,
				describedby: opts.message ? descId : undefined
			},
			render: (close) => {
				const adapter = getAdapter('Dialog')
				return (
				<div 
					class={[adapter.classes?.base || 'pounce-dialog', opts.size ? `pounce-size-${opts.size}` : '']}
					traits={getVariantTrait(opts.variant)}
				>
					<header if={opts.title}>
						<h3 id={titleId}>{opts.title}</h3>
						<Button.contrast
							el={{
								class: 'pounce-dialog-close',
								style: 'padding: 0.25rem; min-width: auto; height: auto;'
							}}
							onClick={() => close(null)}
							ariaLabel="Close"
						>
							<Icon name="close" />
						</Button.contrast>
					</header>
					<main id={descId}>
						{typeof opts.message === 'string' ? <p>{opts.message}</p> : opts.message}
					</main>
					<footer if={opts.buttons}>
						<for each={Object.entries(opts.buttons || {})}>
							{([key, spec]) => {
								const btn = typeof spec === 'string' ? { text: spec } : spec
								return (
									<Button
										variant={btn.variant || 'secondary'}
										disabled={btn.disabled}
										onClick={() => {
											if (btn.onClick) btn.onClick()
											close(key)
										}}
									>
										{btn.text}
									</Button>
								)
							}}
						</for>
					</footer>
					<footer else>
						<Button.primary onClick={() => close('ok')}>OK</Button.primary>
					</footer>
				</div>
			)}
		}
	}
}

/**
 * Binds the dialog interactor to a specific overlay dispatcher.
 */
export function bindDialog(overlay: (spec: OverlaySpec) => Promise<any>) {
	const fn = (options: DialogOptions | string) => overlay(Dialog.show(options))

	fn.confirm = async (message: string | { title?: string; message: string }): Promise<boolean> => {
		const opts = typeof message === 'string' ? { message } : message
		const result = await overlay(
			Dialog.show({
				...opts,
				buttons: {
					cancel: { text: 'Cancel', variant: 'secondary' },
					ok: { text: 'Confirm', variant: 'primary' },
				},
			})
		)
		return result === 'ok'
	}

	return fn
}

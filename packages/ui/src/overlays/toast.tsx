import { type Child } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { type OverlaySpec } from './manager'
import { variantClass } from '../shared/variants'

componentStyle.sass`
.pounce-toast
    background: var(--pounce-bg, #ffffff)
    border-radius: var(--pounce-border-radius, 0.5rem)
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
    padding: 0.75rem 1rem
    min-width: 18rem
    display: flex
    align-items: center
    justify-content: space-between
    gap: 1rem
    border-left: 4px solid var(--pounce-secondary, #6b7280)
    animation: pounce-toast-in 0.3s ease-out

    &.pounce-variant-success
        border-left-color: var(--pounce-success, #10b981)
    &.pounce-variant-danger
        border-left-color: var(--pounce-danger, #ef4444)
    &.pounce-variant-warning
        border-left-color: var(--pounce-warning, #f59e0b)
    &.pounce-variant-primary
        border-left-color: var(--pounce-primary, #3b82f6)

    .pounce-toast-content
        flex: 1
        font-size: 0.875rem
        font-weight: 500

    .pounce-toast-close
        background: none
        border: none
        cursor: pointer
        opacity: 0.5
        padding: 0.25rem
        &:hover
            opacity: 1

@keyframes pounce-toast-in
    from
        transform: translateX(100%)
        opacity: 0
    to
        transform: translateX(0)
        opacity: 1
`

export interface ToastOptions {
    message: string | Child
    variant?: 'success' | 'danger' | 'warning' | 'primary' | 'secondary'
    duration?: number
}

/**
 * Standard Toast interactor.
 */
export const Toast = {
    show: (options: ToastOptions | string): OverlaySpec => {
        const opts = typeof options === 'string' ? { message: options } : options
        const duration = opts.duration ?? 3000

        return {
            mode: 'toast',
            render: (close) => {
                // Auto-close after duration
                if (duration > 0) {
                    setTimeout(() => close(null), duration)
                }

                return (
                    <div class={['pounce-toast', variantClass(opts.variant)]}>
                        <div class="pounce-toast-content">
                            {opts.message}
                        </div>
                        <button class="pounce-toast-close" onClick={() => close(null)}>
                            ✕
                        </button>
                    </div>
                )
            }
        }
    }
}

/**
 * Binds the toast interactor to a specific overlay dispatcher.
 * This is primarily used by the Overlay system during scope injection to provide
 * the `toast` helper into the component scope.
 * 
 * The resulting function can be used as `toast(options)` or `toast.success(options)`.
 * 
 * @example
 * ```tsx
 * const toast = bindToast(scope.overlay);
 * toast.success("Saved successfully!");
 * ```
 */
export function bindToast(overlay: (spec: OverlaySpec) => Promise<any>) {
    const fn = (options: ToastOptions | string) => overlay(Toast.show(options))

    fn.success = (msg: string | Child) => overlay(Toast.show({ message: msg, variant: 'success' }))
    fn.error = (msg: string | Child) => overlay(Toast.show({ message: msg, variant: 'danger' }))
    fn.warn = (msg: string | Child) => overlay(Toast.show({ message: msg, variant: 'warning' }))
    fn.info = (msg: string | Child) => overlay(Toast.show({ message: msg, variant: 'primary' }))

    return fn
}

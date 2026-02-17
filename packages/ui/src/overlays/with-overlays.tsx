import { type Scope } from '@pounce/core'
import { reactive } from 'mutts'
import { type OverlayEntry, type PushOverlayFunction } from './manager'
import { componentStyle } from '@pounce/kit'
import { perf } from '../perf'
import { getTransitionConfig, applyTransition } from '../shared/transitions'
import type { ComponentName } from '../adapter/types'

componentStyle.sass`
.pounce-overlay-manager
    position: fixed
    inset: 0
    pointer-events: none
    z-index: var(--pounce-overlay-z, 10000)

    &.pounce-local
        position: absolute
        z-index: calc(var(--pounce-overlay-z, 10000) + 50)

    .pounce-backdrop
        position: absolute
        inset: 0
        background: var(--pounce-backdrop, rgba(0, 0, 0, 0.4))
        pointer-events: auto
        backdrop-filter: blur(2px)
        transition: opacity var(--pounce-transition-duration, 0.3s) ease

    .pounce-layer
        position: absolute
        inset: 0
        pointer-events: none
        display: flex
        
        &.pounce-mode-modal
            align-items: center
            justify-content: center
        
        &.pounce-mode-toast
            top: 1rem
            right: 1rem
            bottom: auto
            left: auto
            flex-direction: column
            gap: 0.5rem
        
        &.pounce-mode-drawer-left
            justify-content: flex-start
        &.pounce-mode-drawer-right
            justify-content: flex-end

        > *
            pointer-events: auto

    .pounce-overlay-item
        &.pounce-closing
            .pounce-dialog
                animation: pounce-dialog-out var(--pounce-transition-duration, 0.3s) ease-out forwards
            .pounce-drawer
                animation: pounce-drawer-out-left var(--pounce-transition-duration, 0.3s) ease-out forwards
                &.pounce-drawer-right
                    animation-name: pounce-drawer-out-right
            .pounce-toast
                animation: pounce-toast-out var(--pounce-transition-duration, 0.3s) ease-out forwards

@keyframes pounce-dialog-out
    from
        opacity: 1
        transform: scale(1) translateY(0)
    to
        opacity: 0
        transform: scale(0.95) translateY(10px)

@keyframes pounce-drawer-out-left
    from
        transform: translateX(0)
    to
        transform: translateX(-100%)

@keyframes pounce-drawer-out-right
    from
        transform: translateX(0)
    to
        transform: translateX(100%)

@keyframes pounce-toast-out
    from
        transform: translateX(0)
        opacity: 1
    to
        transform: translateX(100%)
        opacity: 0
`

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
	/** Optional extension helpers to bind to the scope */
	extend?: Record<string, (push: PushOverlayFunction) => (options: any) => Promise<any>>
}

const MODE_COMPONENT_MAP: Record<string, ComponentName> = {
	modal: 'Dialog',
	toast: 'Toast',
	'drawer-left': 'Drawer',
	'drawer-right': 'Drawer'
}

function modeToComponent(mode: string): ComponentName | undefined {
	return MODE_COMPONENT_MAP[mode]
}

/**
 * Generic Overlay Host Component.
 */
export const WithOverlays = (props: WithOverlaysProps, scope: Scope) => {
	// 1. Level Management (Nesting Coordination)
	scope.overlayLevelState ??= reactive({ max: 0 })
	const state = scope.overlayLevelState as { max: number }

	const overlayLevel = (scope.overlayLevel || 0) + 1
	scope.overlayLevel = overlayLevel

	if (overlayLevel > state.max) {
		state.max = overlayLevel
	}

	scope.maxOverlayLevel = () => state.max
	const zIndex = () => 10000 + (overlayLevel * 1000)

	// 2. Local Stack & Logic
	const stack = reactive<OverlayEntry[]>([])
	const overlayElements = new Map<string, HTMLElement>()

	const push: PushOverlayFunction = (spec) => {
		perf?.mark('overlay:show')

		return new Promise((resolve) => {
			const entry: OverlayEntry = {
				...spec,
				id: spec.id || Math.random().toString(36).substring(2, 9),
				closing: false,
				resolve: (value) => {
					perf?.mark('overlay:close')
					perf?.measure(`overlay:${spec.mode}:lifecycle`, 'overlay:show', 'overlay:close')
					const index = stack.findIndex((e) => e.id === entry.id)
					if (index !== -1) {
						entry.closing = true
						const component = modeToComponent(entry.mode)
						const config = getTransitionConfig(component)
						const el = overlayElements.get(entry.id)
						if (el) {
							applyTransition(el, 'exit', config, () => {
								const idx = stack.findIndex((e) => e.id === entry.id)
								if (idx !== -1) stack.splice(idx, 1)
								overlayElements.delete(entry.id)
							})
						} else {
							const duration = config.duration ?? 300
							setTimeout(() => {
								const idx = stack.findIndex((e) => e.id === entry.id)
								if (idx !== -1) stack.splice(idx, 1)
							}, duration)
						}
					}
					resolve(value)
				},
			}
			stack.push(entry)
			perf?.mark?.('overlay:render')
			perf?.measure?.(`overlay:${spec.mode}:show`, 'overlay:show', 'overlay:render')
		})
	}

	// Expose to scope
	scope.overlay = push

	// 3. Bind extensions (Factories)
	if (props.extend) {
		for (const [key, factory] of Object.entries(props.extend)) {
			scope[key] = factory(push)
		}
	}

	// 4. Reactive Orchestration
	const getBackdropModes = () => props.backdropModes || ['modal', 'drawer-left', 'drawer-right']
	const hasBackdrop = () => stack.some(e => getBackdropModes().includes(e.mode))

	const handleBackdropClick = (e: MouseEvent) => {
		// Only close if the backdrop itself was clicked
		if (e.target === e.currentTarget) {
			const top = stack[stack.length - 1]
			if (top && top.dismissible !== false) {
				top.resolve(null)
			}
		}
	}

	const handleKeyDown = (e: KeyboardEvent) => {
		if (stack.length === 0) return

		const top = stack[stack.length - 1]

		if (e.key === 'Escape') {
			if (top && top.dismissible !== false) {
				top.resolve(null)
				e.stopPropagation()
				e.preventDefault()
			}
		}

		if (e.key === 'Tab') {
			// Basic Focus Trap (can be improved with a dedicated lib if needed)
			// For now, Pounce's light footprint favors simple logic
			const host = document.getElementById(`pounce-overlay-manager-${overlayLevel}`)
			if (!host) return

			const focusables = host.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
			if (focusables.length === 0) return

			const firstFocusable = focusables[0] as HTMLElement
			const lastFocusable = focusables[focusables.length - 1] as HTMLElement

			if (e.shiftKey) {
				if (document.activeElement === firstFocusable) {
					lastFocusable.focus()
					e.preventDefault()
				}
			} else {
				if (document.activeElement === lastFocusable) {
					firstFocusable.focus()
					e.preventDefault()
				}
			}
		}
	}

	const applyAutoFocus = (container: HTMLElement, strategy: boolean | string) => {
		if (strategy === true) {
			// Smart default: first focusable element
			const focusable = container.querySelector(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
			if (focusable) {
				(focusable as HTMLElement).focus()
			} else {
				container.tabIndex = -1
				container.focus()
			}
		} else if (strategy === 'container') {
			container.tabIndex = -1
			container.focus()
		} else if (strategy === 'first-button') {
			const btn = container.querySelector('button')
			if (btn) (btn as HTMLElement).focus()
		} else if (strategy === 'first-input') {
			const input = container.querySelector('input, textarea, select')
			if (input) (input as HTMLElement).focus()
		} else if (typeof strategy === 'string') {
			// Treat as CSS selector
			const target = container.querySelector(strategy)
			if (target) (target as HTMLElement).focus()
		}
	}

	const isModalMode = (mode: string) => mode === 'modal' || mode.startsWith('drawer')

	const renderOverlayItem = (entry: OverlayEntry, modal: boolean) => (
		<div
			class={['pounce-overlay-item', entry.closing ? 'pounce-closing' : '']}
			role={modal ? 'dialog' : undefined}
			aria-modal={modal ? 'true' : undefined}
			aria-labelledby={entry.aria?.labelledby}
			aria-describedby={entry.aria?.describedby}
			aria-label={entry.aria?.label}
			use={(el: HTMLDivElement) => {
				overlayElements.set(entry.id, el)
				if (!entry.closing) {
					const autoFocus = entry.autoFocus ?? modal
					if (autoFocus) {
						requestAnimationFrame(() => {
							applyAutoFocus(el, autoFocus)
						})
					}
				}
			}}
		>
			{entry.render(entry.resolve)}
		</div>
	)

	const layerItems = (mode: string) => stack.filter(e => e.mode === mode)

	const renderLayer = (mode: string) => {
		const modal = isModalMode(mode)
		const toast = mode === 'toast'
		return (
			<div
				class={['pounce-layer', `pounce-mode-${mode}`]}
				role={toast ? 'log' : undefined}
				aria-live={toast ? 'polite' : undefined}
			>
				<for each={layerItems(mode)}>
					{(entry: OverlayEntry) => renderOverlayItem(entry, modal)}
				</for>
			</div>
		)
	}

	const layers = props.layers && props.layers.length > 0
		? props.layers.map(renderLayer)
		: null
	const flat = !layers
		? (
			<div class="pounce-layer pounce-flat">
				<for each={stack}>
					{(entry: OverlayEntry) => renderOverlayItem(entry, isModalMode(entry.mode))}
				</for>
			</div>
		)
		: null

	return (
		<fragment>
			{props.children}
			<div
				class={['pounce-overlay-manager', props.fixed !== false ? 'pounce-fixed' : 'pounce-local']}
				id={`pounce-overlay-manager-${overlayLevel}`}
				style={`--pounce-overlay-z: ${zIndex()}`}
				onKeydown={handleKeyDown}
			>
				<div
					if={hasBackdrop()}
					class="pounce-backdrop"
					onClick={handleBackdropClick}
				/>
				{layers}
				{flat}
			</div>
		</fragment>
	)
}

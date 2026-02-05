import { type Child, type Scope } from '@pounce/core'
import { reactive } from 'mutts'
import { type OverlayEntry, type PushOverlayFunction } from './manager'
import { componentStyle } from '@pounce/kit/dom'

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
        transition: opacity 0.2s ease

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
`

export interface WithOverlaysProps {
	children?: Child
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

	const push: PushOverlayFunction = (spec) => {
		return new Promise((resolve) => {
			const entry: OverlayEntry = {
				...spec,
				id: spec.id || Math.random().toString(36).substring(2, 9),
				resolve: (value) => {
					const index = stack.findIndex((e) => e.id === entry.id)
					if (index !== -1) {
						stack.splice(index, 1)
					}
					resolve(value)
				},
			}
			stack.push(entry)
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

	const renderLayer = (mode?: string) => {
		const items = mode
			? stack.filter(e => e.mode === mode)
			: stack

		if (items.length === 0 && mode) return null

		// Higher roles for accessibility
		const isModalLayer = mode === 'modal' || (mode && mode.startsWith('drawer'))
		const isToastLayer = mode === 'toast'

		return (
			<div
				class={['pounce-layer', mode ? `pounce-mode-${mode}` : 'pounce-flat']}
				role={isToastLayer ? 'log' : undefined}
				aria-live={isToastLayer ? 'polite' : undefined}
			>
				<for each={items}>
					{(entry: OverlayEntry) => (
						<div
							class="pounce-overlay-item"
							role={isModalLayer ? 'dialog' : undefined}
							aria-modal={isModalLayer ? 'true' : undefined}
							aria-labelledby={entry.aria?.labelledby}
							aria-describedby={entry.aria?.describedby}
							aria-label={entry.aria?.label}
						>
							{entry.render(entry.resolve)}
						</div>
					)}
				</for>
			</div>
		)
	}

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
					aria-hidden="true"
					onClick={handleBackdropClick}
				/>

				<fragment if={props.layers && props.layers.length > 0}>
					<for each={props.layers!}>
						{(mode: string) => renderLayer(mode)}
					</for>
				</fragment>
				<fragment else>
					{renderLayer()}
				</fragment>
			</div>
		</fragment>
	)
}

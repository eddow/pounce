import type { TransitionConfig } from '../adapter/types'
import { getAdapter, getGlobalAdapter } from '../adapter/registry'
import type { ComponentName } from '../adapter/types'

/**
 * Gets the transition configuration for a component.
 * 
 * Resolution order:
 * 1. Component-specific transitions (most specific)
 * 2. Global adapter transitions
 * 3. Default fallback (300ms duration)
 * 
 * @param componentName - Optional component name for component-specific config
 * @returns TransitionConfig with at least duration defined
 * 
 * @example
 * // Get global transitions
 * const config = getTransitionConfig()
 * 
 * // Get Dialog-specific transitions (overrides global)
 * const dialogConfig = getTransitionConfig('Dialog')
 */
export function getTransitionConfig(componentName?: ComponentName): TransitionConfig {
	const globalAdapter = getGlobalAdapter()
	
	// Check component-specific transitions first
	if (componentName) {
		const componentAdapter = getAdapter(componentName)
		if ('transitions' in componentAdapter && componentAdapter.transitions) {
			return {
				duration: 300,
				...globalAdapter.transitions,
				...componentAdapter.transitions
			}
		}
	}
	
	// Fall back to global transitions
	if (globalAdapter.transitions) {
		return {
			duration: 300,
			...globalAdapter.transitions
		}
	}
	
	// Default fallback
	return {
		duration: 300
	}
}

/**
 * Applies transition classes to an element and returns cleanup function.
 * Handles both enter and exit animations with proper timing.
 * 
 * @param element - Element to apply transitions to
 * @param type - 'enter' or 'exit' animation
 * @param config - Transition configuration
 * @param onComplete - Callback when animation completes
 * @returns Cleanup function to remove event listeners
 * 
 * @example
 * // Enter animation
 * const cleanup = applyTransition(dialogEl, 'enter', config)
 * 
 * // Exit animation with callback
 * applyTransition(dialogEl, 'exit', config, () => {
 *   dialogEl.remove()
 * })
 */
export function applyTransition(
	element: HTMLElement,
	type: 'enter' | 'exit',
	config: TransitionConfig,
	onComplete?: () => void
): () => void {
	const className = type === 'enter' ? config.enterClass : config.exitClass
	const duration = config.duration ?? 300
	
	if (!className) {
		// No transition class - call callback immediately
		onComplete?.()
		return () => {}
	}
	
	// Apply transition class
	element.classList.add(className)
	if (config.activeClass) {
		element.classList.add(config.activeClass)
	}
	
	let completed = false
	let timeoutId: number | undefined
	
	const complete = () => {
		if (completed) return
		completed = true
		
		// Cleanup
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId)
		}
		element.removeEventListener('animationend', handleAnimationEnd)
		element.removeEventListener('transitionend', handleTransitionEnd)
		
		// Remove transition classes
		if (className) element.classList.remove(className)
		if (config.activeClass) element.classList.remove(config.activeClass)
		
		// Call completion callback
		onComplete?.()
	}
	
	const handleAnimationEnd = (e: AnimationEvent) => {
		if (e.target === element) {
			complete()
		}
	}
	
	const handleTransitionEnd = (e: TransitionEvent) => {
		if (e.target === element) {
			complete()
		}
	}
	
	// Listen for animation/transition end events
	element.addEventListener('animationend', handleAnimationEnd, { once: true })
	element.addEventListener('transitionend', handleTransitionEnd, { once: true })
	
	// Fallback timeout (1.5x duration to account for delays)
	timeoutId = window.setTimeout(complete, duration * 1.5)
	
	// Return cleanup function
	return () => {
		if (!completed) {
			complete()
		}
	}
}

import type { TransitionConfig } from '../adapter/types';
import type { ComponentName } from '../adapter/types';
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
export declare function getTransitionConfig(componentName?: ComponentName): TransitionConfig;
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
export declare function applyTransition(element: HTMLElement, type: 'enter' | 'exit', config: TransitionConfig, onComplete?: () => void): () => void;
//# sourceMappingURL=transitions.d.ts.map
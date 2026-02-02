import type { Client } from './types.js'

/**
 * The client singleton export slot.
 * This will be bound to either:
 * - The reactive browser client (in DOM environment)
 * - An ALS-backed proxy (in Node/SSR environment)
 */
export let client: Client = null!

/**
 * Sets the active client implementation.
 * Called by the environment-specific bootstrap code.
 */
export const setClient = (impl: Client) => {
	client = impl
}

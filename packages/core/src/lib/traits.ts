/**
 * Trait system for pounce/core
 * Provides low-level trait objects and application logic
 */

import { traitLayer } from './utils'

/**
 * A trait defines a reusable bundle of properties (classes, styles, attributes) that can be applied to any element
 */
export interface Trait {
	/** CSS classes to add or remove */
	classes?: string[] | Record<string, boolean>
	/** Inline styles to apply */
	styles?: Record<string, string | number>
	/** HTML attributes to set */
	attributes?: Record<string, string | boolean | number>
}

export const asArray = (item: any): any[] => {
	if (!item) return []
	if (Array.isArray(item)) return item
	if (typeof item === 'string') return item.split(' ').filter(Boolean)
	// We don't treat the case where classes are given as a record of boolean - here we just stack, the construction of a string[] will be done at the really end
	return [item]
}

/**
 * Builds a prototype chain of read-only reactive layers from an array of traits,
 * and returns accumulated class/style arrays from all traits.
 *
 * @param traits - Single trait or array of traits
 * @returns { chain, classes, styles } where chain is the prototype chain base,
 *          classes and styles are accumulated arrays from all traits
 */
export function buildTraitChain(traits: Trait | Trait[] | undefined): {
	chain: Record<string, any> | null
	classes: any[]
	styles: any[]
} {
	const items = asArray(traits)
	let chain: Record<string, any> | null = null
	const classes: any[] = []
	const styles: any[] = []

	for (const trait of items) {
		if (!trait) continue
		if (trait.attributes) chain = traitLayer(chain, trait)
		classes.push(...asArray(trait.classes))
		styles.push(...asArray(trait.styles))
	}

	return { chain, classes, styles }
}

import { isObject } from 'mutts'

function isString(value: any): value is string {
	return typeof value === 'string'
}

/**
 * Utility for generating CSS class names
 */
export type ClassInput = string | ClassInput[] | Record<string, boolean>

/**
 * Generates a CSS class name string from various inputs
 *
 * @param input - Can be a string, array (including nested arrays), or object with boolean values
 * @returns A space-separated string of class names
 */
export function classNames(input: ClassInput, classes: string[] = []): string {
	if (isString(input)) {
		classes.push(input)
	} else if (Array.isArray(input)) {
		for (const item of input) classNames(item, classes)
	} else if (isObject(input) && input !== null) {
		for (const [className, shouldInclude] of Object.entries(input)) {
			if (shouldInclude) {
				classes.push(className)
			} else {
				const index = classes.indexOf(className)
				if (index !== -1) classes.splice(index, 1)
			}
		}
	}

	return classes.join(' ')
}

/**
 * Utility for generating inline style objects
 */

export type StylePrimitive = string | number
export type StyleValue = StylePrimitive | null | undefined | false
export type StyleRecord = Record<string, StyleValue>
export type StyleInput = StyleRecord | string | StyleInput[] | null | undefined | false
function kebabToCamelCase(input: string): string {
	// Fast path: no dash
	if (!input.includes('-')) return input
	return input
		.trim()
		.replace(/^-+/, '')
		.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase())
}

function parseCssText(cssText: string): StyleRecord {
	const out: StyleRecord = {}
	const parts = cssText.split(';')
	for (const part of parts) {
		if (!part) continue
		const idx = part.indexOf(':')
		if (idx === -1) continue
		const rawKey = part.slice(0, idx).trim()
		if (!rawKey) continue
		let rawValue = part.slice(idx + 1).trim()
		if (!rawValue) continue
		// Strip !important if present
		if (rawValue.endsWith('!important')) rawValue = rawValue.replace(/!important\s*$/i, '').trim()
		const key = kebabToCamelCase(rawKey)
		out[key] = rawValue
	}
	return out
}

/**
 * Merge style inputs into a single object. Later inputs override earlier ones.
 * - Accepts objects, arrays (nested), falsy values (ignored), and CSS text strings.
 */
export function styles(...inputs: StyleInput[]): StyleRecord {
	const result: StyleRecord = {}

	function apply(input: StyleInput): void {
		if (!input) return
		if (Array.isArray(input)) {
			for (const item of input) apply(item)
			return
		}
		if (isString(input)) input = parseCssText(input)
		if (isObject(input))
			for (const [k, v] of Object.entries(input))
				if (v !== false && v !== null) result[k] = v as StylePrimitive
				else delete result[k]
	}

	for (const input of inputs) apply(input)

	return result
}

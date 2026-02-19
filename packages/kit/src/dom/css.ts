import { flavored } from 'mutts'

/**
 * CSS template tag functions for inline CSS processing
 *
 * These functions are transformed by the Vite plugin to process CSS
 * through Vite's PostCSS pipeline (autoprefixer, etc.)
 *
 * For syntax highlighting in VS Code/Cursor, install the "es6-string-html" extension:
 * https://open-vsx.org/extension/Tobermory/es6-string-html
 *
 * This extension automatically detects `css`, `sass`, and `scss` tags in template
 * literals and provides proper syntax highlighting without any configuration.
 *
 * @example
 * ```ts
 * import { css, sass, scss } from './lib/css'
 *
 * css`.my-class { color: red; }`
 *
 * sass`
 * .container
 *   color: blue
 *   &:hover
 *     color: red
 * `
 *
 * scss`
 * .container {
 *   color: blue;
 *   &:hover {
 *     color: red;
 *   }
 * }
 * `
 * ```
 */

// Runtime CSS injection function
// This is called by the transformed code from the Vite plugin
// SSR Collection State
// TODO: What on fucking earth is doing ssr-related concerns in a "dom" entry-point ??!?
const ssrStyles = new Map<string, string>() // hash -> css

// Runtime CSS injection function
// This is called by the transformed code from the Vite plugin
const injectedStyles = new Set<string>() // hashes that are already in the DOM

/**
 * Simple string hash function for identifying CSS chunks
 * DJB2 variant
 */
function hashStrings(str: string): string {
	let h = 5381
	for (let i = 0; i < str.length; i++) {
		h = (h * 33) ^ str.charCodeAt(i)
	}
	return (h >>> 0).toString(36)
}

function getCallerId(): string {
	try {
		const stack = new Error().stack
		if (!stack) return 'unknown'

		// Parse the stack trace to find the caller
		const lines = stack.split('\n')
		for (const line of lines) {
			// Look for file paths, ignoring internal/library frames if possible
			// In Vite dev, paths usually look like http://localhost:5173/src/components/icon.tsx
			if (line.includes('/src/') && !line.includes('lib/css.ts')) {
				const match = line.match(/(https?:\/\/[^)]+)/) || line.match(/(\/[\w.-]+\/[\w.-]+)/)
				if (match) {
					const url = match[1]
					// specific fix: extract relative path from /src/
					const srcIndex = url.indexOf('/src/')
					if (srcIndex !== -1) {
						// Return "/src/..." and strip query params (?) or line numbers (:)
						return url.substring(srcIndex).split('?')[0].split(':')[0]
					}
					return url
				}
			}
		}
	} catch (_e) {}
	return 'default'
}

let hydrationCheckerArg: undefined | { id: string }

export function __injectCSS(css: string): void {
	const hash = hashStrings(css)

	// Server-side: Collect styles
	if (typeof document === 'undefined') {
		if (!ssrStyles.has(hash)) {
			ssrStyles.set(hash, css)
		}
		return
	}

	// Client-side: Hydration check
	// If this is the FIRST time we run in the browser, check for pre-hydrated styles
	if (hydrationCheckerArg === undefined) {
		// We use an object identity check or similar to ensure we only do this once conceptually,
		// but strictly speaking, checking if the DOM has the attribute is enough.
		// However, we want to populate `injectedStyles` from the DOM if present.
		const hydrationStyle = document.querySelector('style[data-hydrated-hashes]')
		if (hydrationStyle) {
			const hashes = hydrationStyle.getAttribute('data-hydrated-hashes')?.split(',') || []
			hashes.forEach((h) => injectedStyles.add(h))
		}
		hydrationCheckerArg = { id: 'checked' }
	}

	if (injectedStyles.has(hash)) return
	injectedStyles.add(hash)

	const callerId = getCallerId()

	// Find or create a style tag for this caller
	let style = document.querySelector(`style[data-vite-css-id="${callerId}"]`) as HTMLStyleElement
	if (!style) {
		style = document.createElement('style')
		style.setAttribute('data-vite-css-id', callerId)
		document.head.appendChild(style)
	}

	// Append the CSS
	// Using appendChild with a Text node is often faster than setting textContent for appending
	style.appendChild(document.createTextNode(`${css}\n`))
}

/**
 * Returns the HTML string for style tags collected during SSR.
 * This should be injected into the <head> of the HTML page.
 */
export function getSSRStyles(): string {
	if (ssrStyles.size === 0) return ''

	const hashes = Array.from(ssrStyles.keys())
	const cssContent = Array.from(ssrStyles.values()).join('\n')

	return `<style data-hydrated-hashes="${hashes.join(',')}">${cssContent}</style>`
}

/**
 * CSS template tag function
 *
 * Processes plain CSS through Vite's PostCSS pipeline.
 * The CSS is automatically injected into the document head.
 *
 * @example
 * ```ts
 * css`.my-class { color: red; }`
 * ```
 *
 * @note Template string interpolation (${...}) is not yet supported.
 * Use static template strings only.
 */
export function css(strings: TemplateStringsArray, ...values: any[]): void {
	// This function is replaced by the Vite plugin during build
	// This is just a runtime fallback (shouldn't be reached in normal usage)
	const cssText = strings.reduce((acc, str, i) => {
		return acc + str + (values[i] ?? '')
	}, '')
	__injectCSS(cssText)
}

/**
 * SASS template tag function
 *
 * Processes SASS/SCSS syntax through Vite's SASS preprocessor.
 * Supports nesting, variables, mixins, etc.
 *
 * @example
 * ```ts
 * sass`
 *   .container {
 *     color: blue;
 *     &:hover { color: red; }
 *   }
 * `
 * ```
 */
export function sass(strings: TemplateStringsArray, ...values: any[]): void {
	// This function is replaced by the Vite plugin during build
	// This is just a runtime fallback (shouldn't be reached in normal usage)
	const cssText = strings.reduce((acc, str, i) => {
		return acc + str + (values[i] ?? '')
	}, '')
	__injectCSS(cssText)
}

/**
 * SCSS template tag function
 *
 * Processes SCSS syntax (curly braces, semicolons) through the SASS preprocessor.
 *
 * @example
 * ```ts
 * scss`
 * .container {
 *   color: blue;
 *   &:hover {
 *     color: red;
 *   }
 * }
 * `
 * ```
 */
export function scss(strings: TemplateStringsArray, ...values: any[]): void {
	// This function is replaced by the Vite plugin during build
	// This is just a runtime fallback (shouldn't be reached in normal usage)
	const cssText = strings.reduce((acc, str, i) => {
		return acc + str + (values[i] ?? '')
	}, '')
	__injectCSS(cssText)
}

/**
 * Component-specific style tag.
 * Automatically wrapped in @layer pounce.components by the Vite plugin.
 */
export const componentStyle = flavored(css, {
	css,
	sass,
	scss,
})

/**
 * Base style tag for the UI library.
 * Automatically wrapped in @layer pounce.base by the Vite plugin.
 */
export const baseStyle = flavored(css, {
	css,
	sass,
	scss,
})

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
 * @example
 * ```ts
 * import { css, sass, scss } from '@pounce/kit'
 *
 * css`.my-class { color: red; }`
 *
 * sass`
 * .container
 *   color: blue
 *   &:hover
 *     color: red
 * `
 * ```
 */

const ssrStyles = new Map<string, string>() // hash -> css
const injectedStyles = new Set<string>() // hashes already in the DOM

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
		const lines = stack.split('\n')
		for (const line of lines) {
			if (line.includes('/src/') && !line.includes('kit/src/css.ts')) {
				const match = line.match(/(https?:\/\/[^)]+)/) || line.match(/(\/[\w.-]+\/[\w.-]+)/)
				if (match) {
					const url = match[1]
					const srcIndex = url.indexOf('/src/')
					if (srcIndex !== -1) return url.substring(srcIndex).split('?')[0].split(':')[0]
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

	if (typeof document === 'undefined') {
		if (!ssrStyles.has(hash)) ssrStyles.set(hash, css)
		return
	}

	if (hydrationCheckerArg === undefined) {
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
	let style = document.querySelector(`style[data-vite-css-id="${callerId}"]`) as HTMLStyleElement
	if (!style) {
		style = document.createElement('style')
		style.setAttribute('data-vite-css-id', callerId)
		document.head.appendChild(style)
	}
	style.appendChild(document.createTextNode(`${css}\n`))
}

/**
 * Returns the HTML string for style tags collected during SSR.
 * Inject into the `<head>` of the HTML page.
 */
export function getSSRStyles(): string {
	if (ssrStyles.size === 0) return ''
	const hashes = Array.from(ssrStyles.keys())
	const cssContent = Array.from(ssrStyles.values()).join('\n')
	return `<style data-hydrated-hashes="${hashes.join(',')}">${cssContent}</style>`
}

export function css(strings: TemplateStringsArray, ...values: any[]): void {
	const cssText = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
	__injectCSS(cssText)
}

export function sass(strings: TemplateStringsArray, ...values: any[]): void {
	const cssText = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
	__injectCSS(cssText)
}

export function scss(strings: TemplateStringsArray, ...values: any[]): void {
	const cssText = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
	__injectCSS(cssText)
}

/** Component-specific style tag. Wrapped in `@layer pounce.components` by the Vite plugin. */
export const componentStyle = flavored(css, { css, sass, scss })

/** Base style tag. Wrapped in `@layer pounce.base` by the Vite plugin. */
export const baseStyle = flavored(css, { css, sass, scss })

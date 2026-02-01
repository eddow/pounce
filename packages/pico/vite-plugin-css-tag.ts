/**
 * Vite plugin for Pounce-UI that transforms `css`, `sass`, and `scss` template literals
 * into processed CSS injections via `__injectCSS`.
 * 
 * Key Features:
 * 1. **Build-time Pre-processing**: Compiles SASS/SCSS to CSS during the build, 
 *    removing the need for a runtime compiler in the browser.
 * 2. **SSR Support**: Enables style collection on the server by transforming tags
 *    into function calls that can track used styles for initial HTML injection.
 * 3. **Deduplication**: Works with a runtime (`lib/css.ts`) that hashes CSS
 *    content to ensure each style block is injected into the DOM exactly once.
 * 4. **PostCSS Integration**: Ensures inline styles are processed through Vite's
 *    standard PostCSS pipeline (autoprefixer, etc.).
 */
import { dirname, relative } from 'path'
import { compileString } from 'sass'
import type { Plugin } from 'vite'

interface CSSTagMatch {
	fullMatch: string
	tagName: string
	cssContent: string
	startIndex: number
	endIndex: number
}

/**
 * Vite plugin that transforms css/sass/scss template literals
 * into processed CSS injections
 */
export function cssTagPlugin(): Plugin {
	const cssIdMap = new Map<string, string>()

	return {
		name: 'vite-plugin-css-tag',
		enforce: 'pre',

		async transform(code, id) {
			// Only process TypeScript/JavaScript files
			if (!/\.(tsx?|jsx?)$/.test(id)) return null

			// Skip processing the css.ts file itself to avoid circular imports
			if (id.includes('/lib/css.ts') || id.endsWith('lib/css.ts')) return null

			// Find all css/sass/scss template literal calls
			const matches = findCSSTagCalls(code)
			if (matches.length === 0) return null

			// Check if __injectCSS is already imported
			const hasInjectCSSImport = /import\s+.*__injectCSS.*from/.test(code)

			let transformedCode = code
			let offset = 0

			// Process matches in reverse order to maintain indices
			for (const match of matches.reverse()) {
				// Start from the raw template literal content
				let processedCSS = match.cssContent

				// For sass`...` use indented SASS syntax and compile to CSS
				if (match.tagName === 'sass') {
					try {
						const result = compileString(processedCSS, {
							syntax: 'indented',
							style: 'expanded',
							sourceMap: false,
						})
						processedCSS = result.css
					} catch (error) {
						throw new Error(
							`SASS compilation failed in ${id}: ${
								error instanceof Error ? error.message : String(error)
							}`,
						)
					}
				} else if (match.tagName === 'scss') {
					// For scss`...` use SCSS syntax and compile to CSS
					try {
						const result = compileString(processedCSS, {
							syntax: 'scss',
							style: 'expanded',
							sourceMap: false,
						})
						processedCSS = result.css
					} catch (error) {
						throw new Error(
							`SCSS compilation failed in ${id}: ${
								error instanceof Error ? error.message : String(error)
							}`,
						)
					}
				}

				// For css`...` we currently treat content as plain CSS

				// Inline the processed CSS directly into the module
				const replacement = `__injectCSS(${JSON.stringify(processedCSS)});`

				const before = transformedCode.substring(0, match.startIndex + offset)
				const after = transformedCode.substring(match.endIndex + offset)
				transformedCode = before + replacement + after

				// Adjust offset for next replacement
				offset += replacement.length - (match.endIndex - match.startIndex)
			}

			// Only add import if it doesn't already exist
			if (matches.length > 0 && !hasInjectCSSImport) {
				// Calculate relative path to css.ts
				let relativePath = './lib/css'
				try {
					if (id.includes('/src/')) {
						const fileDir = dirname(id)
						const srcIndex = id.indexOf('/src/')
						const srcPath = id.substring(0, srcIndex + 5) // includes /src/
						const targetPath = `${srcPath}lib/css.ts`

						// Calculate relative path from current file to target
						const rel = relative(fileDir, targetPath).replace(/\\/g, '/')

						// Ensure it starts with ./ or ../
						if (rel && !rel.startsWith('.')) {
							relativePath = `./${rel.replace(/\.ts$/, '')}`
						} else if (rel) {
							relativePath = rel.replace(/\.ts$/, '')
						}
					}
				} catch (error) {
					// Fallback - try to use a simple relative path
					// If file is in src/, assume lib/css is at same level or one level up
					if (id.includes('/src/')) {
						const depth =
							(id.match(/\//g) || []).length - (id.indexOf('/src/') + '/src/'.split('/').length - 1)
						if (depth > 1) {
							relativePath = '../lib/css'
						} else {
							relativePath = './lib/css'
						}
					}
				}

				transformedCode = `import { __injectCSS } from ${JSON.stringify(relativePath)}; ${transformedCode}`
			}

			return {
				code: transformedCode,
				map: null, // Could generate source map if needed
			}
		},

		resolveId(id) {
			// Handle virtual CSS modules (with or without ?inline)
			if (id.startsWith('\0css-tag:')) {
				return id
			}
			return null
		},

		async load(id) {
			// Handle ?inline query - process CSS/SASS and return as string
			if (id.includes('?inline')) {
				const baseId = id.split('?')[0]
				const cssContent = cssIdMap.get(baseId)
				if (!cssContent) {
					throw new Error(`CSS content not found for ${baseId}`)
				}

				// Process SASS (indented) if needed
				let processedCSS = cssContent
				if (baseId.endsWith('.sass')) {
					try {
						const result = compileString(cssContent, {
							syntax: 'indented',
							style: 'expanded',
							sourceMap: false,
						})
						processedCSS = result.css
					} catch (error) {
						throw new Error(
							`SASS compilation failed: ${error instanceof Error ? error.message : String(error)}`
						)
					}
				}

				// Return processed CSS as a string export
				return `export default ${JSON.stringify(processedCSS)};`
			}

			// Load virtual CSS modules (let Vite process as CSS)
			if (id.startsWith('\0css-tag:')) {
				const cssContent = cssIdMap.get(id)
				if (!cssContent) {
					throw new Error(`CSS content not found for ${id}`)
				}

				// For .sass files, compile indented SASS first
				if (id.endsWith('.sass')) {
					try {
						const result = compileString(cssContent, {
							syntax: 'indented',
							style: 'expanded',
							sourceMap: false,
						})
						return result.css
					} catch (error) {
						throw new Error(
							`SASS compilation failed: ${error instanceof Error ? error.message : String(error)}`
						)
					}
				}

				// Return the raw CSS content - Vite will process it through PostCSS
				return cssContent
			}
			return null
		},

		async transformIndexHtml(html) {
			// No-op, but this hook exists to ensure we're in the right phase
			return html
		},
	}
}

/**
 * Find all css/sass/scss template literal calls in code
 * Matches patterns like: css`...`, sass`...`, scss`...`
 *
 * Note: Currently only supports static template strings without interpolation.
 * Template strings with ${...} expressions are not yet supported.
 */
function findCSSTagCalls(code: string): CSSTagMatch[] {
	const matches: CSSTagMatch[] = []

	// Match css`...`, sass`...`, scss`...` template literals
	// Also handles cases like: css `.class { }` (with space)
	// This regex only matches static template strings (no ${...} interpolation)
	const regex = /\b(css|sass|scss)\s*`([^`${]*(?:\\.[^`${]*)*)`/g

	let match: RegExpExecArray | null = null
	// biome-ignore lint/suspicious/noAssignInExpressions: Because I can
	while ((match = regex.exec(code)) !== null) {
		const [fullMatch, tagName, cssContent] = match

		// Skip if it contains ${ (interpolation) - not supported yet
		if (fullMatch.includes('${')) {
			continue
		}

		// Unescape template literal content
		const unescapedContent = cssContent
			.replace(/\\`/g, '`')
			.replace(/\\\$/g, '$')
			.replace(/\\n/g, '\n')
			.replace(/\\r/g, '\r')
			.replace(/\\t/g, '\t')

		matches.push({
			fullMatch,
			tagName,
			cssContent: unescapedContent,
			startIndex: match.index!,
			endIndex: match.index! + fullMatch.length,
		})
	}

	return matches
}

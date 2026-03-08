import githubLightCss from 'highlight.js/styles/github.css?raw'
import githubDarkCss from 'highlight.js/styles/github-dark.css?raw'

const STYLE_ID = 'docs-hljs-theme'

function scopeCss(scope: string, css: string) {
	const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
	const blocks = Array.from(cssWithoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g))

	return blocks
		.map(([, selectors, body]) => {
			const scopedSelectors = selectors
				.split(',')
				.map((selector) => `${scope} ${selector.trim()}`)
				.join(',\n')
			return `${scopedSelectors} {${body}}`
		})
		.join('\n')
}

export function ensureHighlightThemes() {
	if (typeof document === 'undefined') return
	if (document.getElementById(STYLE_ID)) return

	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = [
		scopeCss('[data-theme="light"]', githubLightCss),
		scopeCss('[data-theme="dark"]', githubDarkCss),
	].join('\n')
	document.head.appendChild(style)
}

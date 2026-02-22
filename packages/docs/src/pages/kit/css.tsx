import { Code, Section } from '../../components'

const cssTag = `import { css, sass, scss } from '@pounce'

// Template tag functions that inject CSS into the document head.
// Processed through Vite's PostCSS pipeline (autoprefixer, etc.)

css\`.my-class { color: red; }\`

sass\`
.container
  color: blue
  &:hover
    color: red
\`

scss\`
.container {
  color: blue;
  &:hover { color: red; }
}
\``

const componentStyleExample = `import { componentStyle } from '@pounce'

// componentStyle wraps css/sass/scss with @layer pounce.components.
// Use this for component-env-based styles.

componentStyle.sass\`
.my-widget
  padding: 1rem
  border: 1px solid var(--pounce-border)

  &:hover
    background: var(--pounce-bg-muted)
\``

const baseStyleExample = `import { baseStyle } from '@pounce'

// baseStyle wraps css/sass/scss with @layer pounce.base.
// Use this for foundational styles (resets, typography, etc.)

baseStyle.css\`
:root {
  --pounce-font: system-ui, sans-serif;
  --pounce-radius: 0.25rem;
}
\``

const ssrStyles = `import { getSSRStyles } from '@pounce'

// During SSR, styles are collected instead of injected.
// Call getSSRStyles() to get the <style> tag HTML for the <head>.

const stylesHtml = getSSRStyles()
// → '<style data-hydrated-hashes="abc,def">...</style>'

// On hydration, the client detects pre-hydrated styles
// and skips re-injection.`

export default function CSSPage() {
	return (
		<article>
			<h1>CSS Utilities</h1>
			<p>
				Template tag functions for injecting CSS, SASS, and SCSS into the document. Processed
				through Vite's PostCSS pipeline with automatic deduplication and SSR support.
			</p>

			<Section title="css / sass / scss Tags">
				<p>
					Three template tag functions that inject styles into <code>{'<head>'}</code>. Each
					invocation is hashed and deduplicated — calling the same style twice is a no-op.
				</p>
				<Code code={cssTag} lang="tsx" />
			</Section>

			<Section title="componentStyle">
				<p>
					Wraps styles in <code>@layer pounce.components</code>. Use for component-env-based styles.
				</p>
				<Code code={componentStyleExample} lang="tsx" />
			</Section>

			<Section title="baseStyle">
				<p>
					Wraps styles in <code>@layer pounce.base</code>. Use for foundational styles.
				</p>
				<Code code={baseStyleExample} lang="tsx" />
			</Section>

			<Section title="SSR Support">
				<p>
					During SSR, styles are collected in memory. <code>getSSRStyles()</code> returns the HTML
					for a <code>{'<style>'}</code> tag. On hydration, the client detects pre-hydrated styles
					and skips re-injection.
				</p>
				<Code code={ssrStyles} lang="tsx" />
			</Section>
		</article>
	)
}

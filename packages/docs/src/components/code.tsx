import { componentStyle } from '@pounce'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'

hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('html', xml)

componentStyle.sass`
.code-block
	margin: 1rem 0
	border-radius: 0.5rem
	overflow: hidden
	
	pre
		margin: 0
		padding: 1rem
		overflow-x: auto
		background: var(--pounce-bg-muted, #f5f5f5)
		color: var(--pounce-fg, #333)
		
		// Dark theme support
		[data-theme="dark"] &
			background: var(--pounce-bg-muted, #1a1a1a)
			color: var(--pounce-fg, #e0e0e0)
	
	code
		font-family: 'Fira Code', 'Consolas', monospace
		font-size: 0.9rem
		line-height: 1.5
`

export type CodeProps = {
	code: string
	lang?: string
	class?: string
}

export function Code(p: CodeProps) {
	const model = {
		get lang() {
			return p.lang ?? 'tsx'
		},
		get className() {
			return p.class ?? ''
		},
		get highlighted() {
			return hljs.highlight(p.code, {
				language: this.lang === 'tsx' ? 'typescript' : this.lang,
			})
		},
	}

	return (
		<div class={`code-block ${model.className}`}>
			<pre>
				<code innerHTML={model.highlighted.value} class={`hljs language-${model.lang}`} />
			</pre>
		</div>
	)
}

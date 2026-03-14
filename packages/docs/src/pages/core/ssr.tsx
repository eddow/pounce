import { Code, Section } from '../../components'

const dualEntry = `// @sursaut/core has two entry points:
//
// Browser (dom):
import { latch } from '@sursaut/core'
// → uses real document, window, etc.
//
// Node (node):
import { latch } from '@sursaut/core/node'
// → uses JSDOM + AsyncLocalStorage proxies
//
// Both export the same API. The difference is how
// DOM globals are provided.`

const nodeEntry = `// In Node.js, @sursaut/core/node sets up:
// 1. JSDOM for DOM APIs (document, window, etc.)
// 2. AsyncLocalStorage proxies so each request
//    gets its own isolated DOM context.

import '@sursaut/core/node'
import { latch } from '@sursaut/core'

// Now latch() works in Node.js — renders to a JSDOM document.
// Each concurrent request gets its own document via ALS.`

const boardSSR = `// @sursaut/board handles SSR automatically.
// You write components normally — the framework handles
// server rendering and client hydration.
//
// See the @sursaut/board documentation for details.`

export default function SSRPage() {
	return (
		<article>
			<h1>SSR</h1>
			<p>Server-side rendering with Sursaut's Node.js entry point.</p>

			<Section title="Dual Entry Points">
				<p>
					<code>@sursaut/core</code> ships two entry points: <code>dom</code> (browser) and{' '}
					<code>node</code> (server). Both export the same API — the difference is how DOM globals (
					<code>document</code>, <code>window</code>, etc.) are provided.
				</p>
				<Code code={dualEntry} lang="tsx" />
			</Section>

			<Section title="Node Entry Point">
				<p>
					The Node entry point sets up JSDOM for DOM APIs and uses
					<code>AsyncLocalStorage</code> proxies so each concurrent request gets its own isolated
					DOM context.
				</p>
				<Code code={nodeEntry} lang="tsx" />
			</Section>

			<Section title="With @sursaut/board">
				<p>
					For full-stack applications, <code>@sursaut/board</code> handles SSR automatically —
					server rendering, hydration, and file-based routing.
				</p>
				<Code code={boardSSR} lang="tsx" />
			</Section>
		</article>
	)
}

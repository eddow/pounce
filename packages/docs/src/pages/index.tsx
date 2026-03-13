import { A } from '@pounce'
import { Code, Section } from '../components'

const installCore = 'pnpm add @pounce/core mutts'
const installFrontend =
	'pnpm add @pounce/core @pounce/kit @pounce/ui @pounce/adapter-pico @picocss/pico mutts'
const installBarrel =
	'pnpm add @pounce/core @pounce/kit @pounce/ui @pounce/adapter-pico @picocss/pico mutts'

const viteConfig = `import { defineConfig } from 'vite'
import { pounceBarrelPlugin, pounceMinimalPackage } from '@pounce/core/plugin'

export default defineConfig({
  plugins: [
    ...pounceMinimalPackage(),
    pounceBarrelPlugin({
      skeleton: 'front-end',
      adapter: '@pounce/adapter-pico',
    }),
  ],
})`

const helloApp = `import { latch } from '@pounce'
import { reactive } from 'mutts'

function Counter() {
  const state = reactive({ count: 0, step: 1 })

  return (
    <main class="container">
      <h1>Pounce counter</h1>
      <p>Count: {state.count}</p>
      <input type="range" min="1" max="5" value={state.step} />
      <button onClick={() => state.count -= state.step}>-{state.step}</button>
      <button onClick={() => state.count += state.step}>+{state.step}</button>
    </main>
  )
}

latch('#app', <Counter />)`

const packageRows = [
	{
		href: '/core',
		name: '@pounce/core',
		description:
			'JSX factory, directives, render-once components, env, SSR entrypoints, Babel plugin',
		status: 'First package to publish',
	},
	{
		href: '/kit',
		name: '@pounce/kit',
		description:
			'Router, client state, storage, i18n utilities, CSS helpers, app-level browser services',
		status: 'Build on top of core',
	},
	{
		href: '/ui',
		name: '@pounce/ui',
		description: 'Headless models, directives, display primitives, overlays, component foundations',
		status: 'Headless layer',
	},
	{
		href: '/adapters/pico',
		name: '@pounce/adapter-pico',
		description:
			'Presentation layer using PicoCSS, so docs and apps get a clean default look quickly',
		status: 'Nice default adapter',
	},
	{
		href: '/board',
		name: '@pounce/board',
		description: 'Meta-framework for routing, SSR, middleware, and full-stack app structure',
		status: 'Later / larger scope',
	},
]

const promiseCards = [
	{
		title: 'Affirmative by construction',
		body: 'Write what should hold. Pounce keeps the rendered world aligned through live bindings instead of repetitive control code.',
	},
	{
		title: 'Logical relationships stay local',
		body: 'JSX expressions become tracked relations, so updates happen exactly where the assertion is consumed.',
	},
	{
		title: 'Assignable means bidirectional',
		body: 'The Babel plugin recognizes member expressions and mutable identifiers and emits live getter/setter bindings.',
	},
	{
		title: 'Layers with a purpose',
		body: 'Behavior lives in core, kit, and ui primitives; adapters own the visual language and the public skin.',
	},
]

const gettingStartedLinks = [
	{
		href: '/getting-started',
		title: 'Getting Started',
		detail: 'Package map, setup order, virtual barrel, first choices',
	},
	{
		href: '/core',
		title: '@pounce/core',
		detail: 'The runtime, JSX factory, directives, SSR, plugin',
	},
	{
		href: '/kit/router',
		title: 'Router',
		detail: 'Client-side routing, links, route definitions, params',
	},
	{ href: '/ui', title: '@pounce/ui', detail: 'Headless UI architecture and reusable primitives' },
]

export default function IndexPage() {
	return (
		<article>
			<section class="docs-hero">
				<div class="docs-hero-copy">
					<div class="docs-eyebrow">Pounce</div>
					<h1>Affirmative UI for the web.</h1>
					<p class="docs-subtitle">
						Pounce is a component-oriented web stack inspired by affirmative and logical styles of
						programming: state what should hold, keep relationships explicit, and let direct DOM
						reactivity maintain the result.
					</p>
					<p>
						Start with <code>@pounce/core</code> for the runtime and compiler story. Add kit, ui,
						and an adapter only when the problem actually asks for them.
					</p>
					<div class="docs-hero-actions">
						<A href="/getting-started" role="button">
							Start here
						</A>
						<A href="/core" role="button" class="secondary">
							Inspect core
						</A>
						<a href="https://www.npmjs.com/package/mutts" role="button" class="contrast">
							View mutts
						</a>
					</div>
				</div>
				<div class="docs-hero-panel">
					<div class="docs-hero-panel-title">Small stack, explicit layers</div>
					<Code code={installCore} lang="bash" />
					<Code code={installFrontend} lang="bash" />
					<p>
						The docs site itself is built with the same stack and exists to explain the shape:
						runtime imports, the Babel plugin, the virtual barrel, and how the packages fit
						together.
					</p>
				</div>
			</section>

			<Section title="Why Pounce">
				<div class="docs-card-grid">
					<for each={promiseCards}>
						{(card) => (
							<div class="docs-home-card">
								<h3>{card.title}</h3>
								<p>{card.body}</p>
							</div>
						)}
					</for>
				</div>
			</Section>

			<Section title="What you install">
				<table>
					<thead>
						<tr>
							<th>Package</th>
							<th>Role</th>
							<th>When to reach for it</th>
						</tr>
					</thead>
					<tbody>
						<for each={packageRows}>
							{(row) => (
								<tr>
									<td>
										<A href={row.href}>
											<code>{row.name}</code>
										</A>
									</td>
									<td>{row.description}</td>
									<td>{row.status}</td>
								</tr>
							)}
						</for>
					</tbody>
				</table>
				<p>
					Underneath all of this sits <a href="https://www.npmjs.com/package/mutts">mutts</a>, which
					is published independently and provides the reactive foundation.
				</p>
			</Section>

			<Section title="The shape of a Pounce app">
				<div class="docs-home-split">
					<div>
						<p>There are really two moving parts to understand early:</p>
						<ul>
							<li>
								<strong>Runtime import surface</strong> — what you import from{' '}
								<code>@pounce/core</code> or the generated <code>@pounce</code> barrel.
							</li>
							<li>
								<strong>Build transform</strong> — the Babel/Vite plugin that rewrites JSX into
								Pounce’s reactive shape.
							</li>
						</ul>
						<p>
							Pounce is not only a runtime import. It is also a transform and a style of
							programming. The docs need to show that up front: imports, Babel plugin, virtual
							barrel, package layering, and the affirmative model behind them.
						</p>
					</div>
					<div class="docs-home-command-stack">
						<div>
							<strong>Core only</strong>
							<Code code={installCore} lang="bash" />
						</div>
						<div>
							<strong>Typical front-end stack</strong>
							<Code code={installBarrel} lang="bash" />
						</div>
					</div>
				</div>
				<Code code={viteConfig} lang="ts" />
				<Code code={helloApp} lang="tsx" />
			</Section>

			<Section title="Where to go next">
				<div class="docs-jump-grid">
					<for each={gettingStartedLinks}>
						{(link) => (
							<A href={link.href}>
								<strong>{link.title}</strong>
								<br />
								<small>{link.detail}</small>
							</A>
						)}
					</for>
				</div>
			</Section>
		</article>
	)
}

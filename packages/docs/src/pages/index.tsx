import { A } from '@pounce'
import { Code, Section } from '../components'

const helloApp = `import { latch } from '@pounce'
import { reactive } from 'mutts'

function Counter() {
  const state = reactive({ count: 0 })
  
  return (
    <main class="container">
      <h1>Counter: {state.count}</h1>
      <button onClick={() => state.count++}>+</button>
      <button onClick={() => state.count--}>-</button>
    </main>
  )
}

latch('#app', <Counter />)`

export default function IndexPage() {
	return (
		<article>
			<h1>Pounce</h1>
			<p>
				<strong>Bring a little Scheme energy back to everyday app development.</strong> Express
				relationships directly, keep state close to behavior, and let fine-grained reactivity keep
				the real DOM honest.
			</p>
			<p class="docs-subtitle">
				Pounce is a <strong>component-oriented UI framework</strong> with familiar JSX, no virtual
				DOM, direct DOM updates, and a clean split between headless behavior, adapters, and
				full-stack tooling.
			</p>

			<Section title="Key Ideas">
				<ul>
					<li>
						<strong>Assertive UI</strong> — describe the relationships you want and let Pounce keep
						the rendered output synchronized.
					</li>
					<li>
						<strong>Components render once</strong> — no re-renders, no diffing. Reactivity is
						fine-grained and localized.
					</li>
					<li>
						<strong>Two-way binding by default</strong> — the Babel plugin auto-generates
						getter/setter pairs for assignable JSX attributes.
					</li>
					<li>
						<strong>Env inheritance</strong> — prototype-chained reactive context, no prop drilling.
					</li>
					<li>
						<strong>Headless + adapter split</strong> — keep behavior in models, presentation in
						adapter packages.
					</li>
					<li>
						<strong>Direct DOM</strong> — no virtual DOM. PounceElement manages real nodes directly.
					</li>
				</ul>
			</Section>

			<Section title="Packages">
				<table>
					<thead>
						<tr>
							<th>Package</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<A href="/core">
									<code>@pounce/core</code>
								</A>
							</td>
							<td>JSX factory, reactivity, directives, env, two-way binding</td>
						</tr>
						<tr>
							<td>
								<A href="/kit">
									<code>@pounce/kit</code>
								</A>
							</td>
							<td>Router, client state, storage, Intl, API utilities</td>
						</tr>
						<tr>
							<td>
								<A href="/ui">
									<code>@pounce/ui</code>
								</A>
							</td>
							<td>Headless models, directives, overlays, and shared UI utilities</td>
						</tr>
						<tr>
							<td>
								<A href="/board">
									<code>@pounce/board</code>
								</A>
							</td>
							<td>Full-stack meta-framework: file-based routing, SSR, middleware</td>
						</tr>
						<tr>
							<td>
								<A href="/adapters/pico">
									<code>@pounce/adapter-pico</code>
								</A>
							</td>
							<td>PicoCSS adapter: variants, bridge CSS, tooltip, icons</td>
						</tr>
					</tbody>
				</table>
				<p>
					Pounce is powered by <a href="https://www.npmjs.com/package/mutts">mutts</a> for reactive
					primitives, but <code>mutts</code> is an external foundation rather than a package in the
					Pounce suite.
				</p>
			</Section>

			<Section title="Quick Start">
				<p>
					Start with the <A href="/getting-started">Getting Started overview</A> for the package
					map, barrel options, and setup order.
				</p>
				<Code
					code="pnpm add @pounce/core @pounce/kit @pounce/ui @pounce/adapter-pico @picocss/pico mutts"
					lang="bash"
				/>
				<p>
					Pair this with a Vite config that installs the Pounce JSX transform and generates the
					front-end virtual <code>@pounce</code> barrel for your chosen adapter.
				</p>
				<Code code={helloApp} lang="tsx" />
			</Section>
		</article>
	)
}

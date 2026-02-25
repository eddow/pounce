import { Code, Section } from '../../components'

const thisMeta = `// 'this' captures the rendered element or component instance
import { reactive } from 'mutts'

const state = reactive({ el: null as HTMLElement | null })

function App() {
  return (
    <div this={state.el}>
      Hello Pounce!
    </div>
  )
}

// state.el now holds the actual HTMLDivElement`

const ifElseMeta = `import { reactive } from 'mutts'

const state = reactive({ loggedIn: false })

function AuthStatus() {
  return (
    <fragment>
      <p if={state.loggedIn}>Welcome back!</p>
      <p else>Please log in.</p>
    </fragment>
  )
}`

const ifNameMeta = `// renders when env.role === 'admin'
function Layout() {
  return (
    <env role="admin">
      <AdminPanel if:role={'admin'} />
      <UserPanel  else />
    </env>
  )
}`

const whenNameMeta = `// calls env.hasRights('edit') to determine visibility
function Nav(_p: {}, env: any) {
  env.hasRights = (right: string) => auth.rights.has(right)

  return (
    <nav>
      <a href="/edit" when:hasRights="edit">Edit</a>
      <a href="/view" when:hasRights="view">View</a>
    </nav>
  )
}`

const catchMeta = `// catch establishing an error boundary with a reset callback
function App() {
  return (
    <div catch={(error, reset) => (
      <div class="error-panel">
        <p>Problem: {String(error)}</p>
        {reset && <button onClick={reset}>Try Again</button>}
      </div>
    )}>
      <UnreliableComponent />
    </div>
  )
}`

const useMeta = `// 'use' applies a directive function to the DOM element
import { tooltip } from '@pounce/ui'

function App() {
  return (
    <button use={tooltip('Click me!')}>
      Hover me
    </button>
  )
}

// Namespaced syntax for env-based directives:
// <div use:resize={sizeCallback} />
// <input use:value={state.val} update:value={(v) => state.val = v} />`

const pickNameMeta = `// Oracle-based selection: env.maxSize(availableOptions) picks what to render
function ResponsiveImage(_p: {}, env: any) {
  const size = reactive({ width: 0 })

  env.maxSize = (options: Set<number>) => {
    return Array.from(options)
      .sort((a, b) => a - b)
      .find((s) => s >= size.width)
  }

  return (
    <div use:resize={(s) => size.width = s.width}>
      <img src="/img-400.webp"  pick:maxSize={400}  />
      <img src="/img-800.webp"  pick:maxSize={800}  />
      <img src="/img-1600.webp" pick:maxSize={Infinity} />
    </div>
  )
}`

export default function MetaAttributesPage() {
	return (
		<article>
			<h1>Meta-attributes</h1>
			<p>
				Special JSX attributes handled natively by the Pounce reconciler. They control an element's
				behavior, lifecycle, or rendering logic without requiring special wrapper components.
			</p>

			<Section title="this">
				<p>
					The <code>this</code> attribute synchronizes the rendered element or component instance to
					a reactive variable. This is Pounce's native alternative to "refs".
				</p>
				<Code code={thisMeta} lang="tsx" />
			</Section>

			<Section title="if / else">
				<p>
					<code>if</code> conditionally renders an element based on a reactive expression. The
					element is created/destroyed in the DOM as the condition changes. Use an adjacent{' '}
					<code>else</code> for fallback rendering.
				</p>
				<Code code={ifElseMeta} lang="tsx" />
			</Section>

			<Section title="if:path (Env Equality)">
				<p>
					<code>if:some-path={'{value}'}</code> renders the element only if the value at{' '}
					<code>some-path</code> in <code>env</code> matches. It supports dash-separated paths
					(e.g., <code>if:user-role="admin"</code> resolves to{' '}
					<code>env.user?.role === "admin"</code>).
				</p>
				<Code code={ifNameMeta} lang="tsx" />
			</Section>

			<Section title="when:path (Env Predicate)">
				<p>
					<code>when:path={'{arg}'}</code> calls the function at <code>path</code> in{' '}
					<code>env</code> and renders the element if the result is truthy. Supports dash-separated
					paths (e.g., <code>when:auth-hasRights="edit"</code>).
				</p>
				<Code code={whenNameMeta} lang="tsx" />
			</Section>

			<Section title="catch">
				<p>
					The <code>catch</code> attribute turns any element into an error boundary. It catches
					rendering or effect errors in its subtree, invoking the fallback function. The boundary
					provides a <code>reset</code> callback if the original content was successfully rendered
					before.
				</p>
				<Code code={catchMeta} lang="tsx" />
			</Section>

			<Section title="use / update">
				<p>
					<code>use</code> applies a creation-time mount hook (called once, synchronously, NOT
					within an effect). Namespaced variants (<code>use:path={'{value}'}</code>) call the
					function at <code>path</code> in <code>env</code>{' '}
					<strong>WITHIN a reactive effect</strong>. The mixin receives{' '}
					<code>(target, value, access)</code> and can return an <code>EffectCloser</code> for
					cleanup. <code>update:path</code> provides a two-way binding callback for these mixins.
				</p>
				<Code code={useMeta} lang="tsx" />
			</Section>

			<Section title="pick:path (Oracle Selection)">
				<p>
					<code>pick:path={'{value}'}</code> implements oracle-based selection. The reconciler
					collects all candidate values from sibling elements and asks the oracle function at{' '}
					<code>path</code> in <code>env</code> (supports dash-separated paths) to pick which
					value(s) should render.
				</p>
				<Code code={pickNameMeta} lang="tsx" />
			</Section>
		</article>
	)
}

import { Code, Section } from '../../components'

const thisMeta = `// 'this' captures the rendered element or component instance
import { reactive } from 'mutts'

const state = reactive({ el: null as HTMLElement | null })

function App() {
  return (
    <div this={state.el}>
      Hello Sursaut!
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
      {/* else shows if no when: conditions matched */}
      <span else>No access</span>
    </nav>
  )
}`

const useMeta = `// 'use' applies a directive function to the DOM element
import { tooltip } from '@sursaut'

function App() {
  return (
    <button use={tooltip('Click me!')}>
      Hover me
    </button>
  )
}

// Namespaced syntax for env-based directives:
// <div use:resize={sizeCallback} />
// <input use:focus />          // defaults to true
// <input use:value={state.val} update:value={(v) => state.val = v} />`

const pickNameMeta = `// Oracle-based selection: env.maxSize(availableOptions) picks what to render
function ResponsiveImage(_p: {}, env: any) {
  const size = reactive({ width: 0 })

  env.maxSize = (options: Set<number>) => {
    return Array.from(options)
      .sort((a, b) => a - b)
      .find((s) => s >= size.width)
  }

  env.resize = (element: HTMLElement, value: any, access: any) => {
    // Handle resize events for the element
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        size.width = entry.contentRect.width
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }

  return (
    <div use:resize={true}>
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
				Special JSX attributes handled natively by the Sursaut reconciler. They control an element's
				behavior, lifecycle, or rendering logic without requiring special wrapper components.
			</p>

			<Section title="this">
				<p>
					The <code>this</code> attribute synchronizes the rendered element or component instance to
					a reactive variable. This is Sursaut's native alternative to "refs".
				</p>
				<Code code={thisMeta} lang="tsx" />
			</Section>

			<Section title="if / else">
				<p>
					<code>if</code> conditionally renders an element based on a <strong>reactive</strong>{' '}
					expression. The element is created/destroyed in the DOM as the condition changes. Use an
					adjacent <code>else</code> for fallback rendering. The <code>else</code> executes if no
					preceding <code>if</code> or <code>when</code> conditions have been satisfied.
				</p>
				<Code code={ifElseMeta} lang="tsx" />
			</Section>

			<Section title="if:path (Env Equality)">
				<p>
					<code>if:some-path={'{value}'}</code> renders the element only if the value at{' '}
					<code>some-path</code> in <code>env</code> matches. It supports dash-separated paths
					(e.g., <code>if:user-role="admin"</code> resolves to{' '}
					<code>env.user?.role === "admin"</code>). <strong>Important:</strong> The env lookup is{' '}
					<strong>not reactive</strong> - changes to env properties won't trigger re-renders. Use{' '}
					<code>if={}</code> (without namespace) for reactive conditions.
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

			<Section title="use / update">
				<p>
					<code>use</code> applies a creation-time mount hook (called once, synchronously, NOT
					within an effect). Namespaced variants (<code>use:path={'{value}'}</code>) call the
					function at <code>path</code> in <code>env</code>{' '}
					<strong>WITHIN a reactive effect</strong>. The mixin receives{' '}
					<code>(target, value, access)</code> and can return an <code>EffectCloser</code> for
					cleanup. Boolean attributes without values default to <code>true</code>.{' '}
					<code>update:path</code> provides a two-way binding callback for these mixins.
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

import { Code, Section } from '../../components'

const forMeta = `import { reactive } from 'mutts'

const items = reactive([
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' },
])

// <for> renders a list reactively
function FruitList() {
  return (
    <ul>
      <for each={items}>{(item) =>
        <li>{item.name}</li>
      }</for>
    </ul>
  )
}

// Pushing, splicing, or reassigning items
// updates only the affected DOM nodes.
items.push({ id: 4, name: 'Date' }) // adds one <li>
items.splice(1, 1)                   // removes Banana's <li>`

const dynamicMeta = `// <dynamic> renders a component chosen at runtime
import { reactive } from 'mutts'

const state = reactive({ component: HomeView as any })

function Shell() {
  return (
    <main>
      <dynamic tag={state.component} />
    </main>
  )
}

// Swap the rendered component:
state.component = SettingsView`

const fragmentMeta = `// <fragment> groups children without a wrapper element
function Header() {
  return (
    <fragment>
      <h1>Title</h1>
      <p>Subtitle</p>
    </fragment>
  )
}

// Equivalent to <> ... </> (JSX Fragment)`

const envMeta = `import { extend } from '@pounce'

// <env> injects values into the env chain without a DOM wrapper
function App(_props: {}, env: any) {
  return (
    <env theme={reactive({ dark: false })} user={{ name: 'Alice' }}>
      <Dashboard />
    </env>
  )
}

// Dashboard and all descendants can read env.theme and env.user`

// Dashboard and all descendants can read env.theme and env.user`

export default function MetaComponentsPage() {
	return (
		<article>
			<h1>Meta-components</h1>
			<p>
				Special JSX tags that control rendering structure without producing DOM elements themselves.
				Unlike directives (which are attributes), these are element-level constructs handled by the
				reconciler.
			</p>

			<Section title="for">
				<p>
					<code>{'<for each={array}>'}</code> renders a child for each item in a reactive array.
					Mutations (push, splice, reassign) update only the affected DOM nodes — no full list
					re-render.
				</p>
				<Code code={forMeta} lang="tsx" />
			</Section>

			<Section title="dynamic">
				<p>
					<code>{'<dynamic tag={...}>'}</code> renders a component chosen at runtime. Pass a
					reactive value (string or component function) — the component swaps when the value
					changes.
				</p>
				<Code code={dynamicMeta} lang="tsx" />
			</Section>

			<Section title="fragment">
				<p>
					<code>{'<fragment>'}</code> groups children without adding a wrapper DOM element.
					Equivalent to the JSX short-hand <code>{'<>...</>'}</code>.
				</p>
				<Code code={fragmentMeta} lang="tsx" />
			</Section>

			<Section title="env">
				<p>
					<code>{'<env>'}</code> injects values into the env chain without adding a DOM wrapper
					element. All descendants inherit the injected values — a declarative alternative to{' '}
					<code>extend()</code>. Note that assigning directly to <code>env.prop = value</code> in
					the code has the same effect.
				</p>
				<Code code={envMeta} lang="tsx" />
			</Section>
		</article>
	)
}

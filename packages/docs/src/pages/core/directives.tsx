import { Code, Section } from '../../components'

const ifDirective = `import { reactive } from 'mutts'

const state = reactive({ loggedIn: false })

// if= / else chain
function AuthStatus() {
  return (
    <>
      <p if={state.loggedIn}>Welcome back!</p>
      <p else>Please log in.</p>
      <button onClick={() => state.loggedIn = !state.loggedIn}>
        Toggle
      </button>
    </>
  )
}

// condition= is the low-level form (same as if=)
<div condition={() => state.visible}>Shown when visible</div>`

const whenDirective = `import { reactive } from 'mutts'

const state = reactive({ view: 'home' as 'home' | 'about' | 'settings' })

// when= renders the matching branch reactively
function App() {
  return (
    <dynamic when={state.view}>
      {{
        home: () => <HomePage />,
        about: () => <AboutPage />,
        settings: () => <SettingsPage />,
      }}
    </dynamic>
  )
}

// Changing state.view swaps the rendered component.
// Only the active branch exists in the DOM.`

const forDirective = `import { reactive } from 'mutts'

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

const dynamicDirective = `// <dynamic> renders a component chosen at runtime
import { reactive } from 'mutts'

const state = reactive({ component: HomeView as any })

function Shell() {
  return (
    <main>
      <dynamic when={state.component}>
        {(Component: any) => <Component />}
      </dynamic>
    </main>
  )
}

// Swap the rendered component:
state.component = SettingsView`

const fragmentDirective = `// <fragment> groups children without a wrapper element
function Header() {
  return (
    <fragment>
      <h1>Title</h1>
      <p>Subtitle</p>
    </fragment>
  )
}

// Equivalent to <> ... </> (JSX Fragment)`

const scopeDirective = `import { extend } from '@pounce/core'

// <scope> injects values into the scope chain without a DOM wrapper
function App(_props: {}, scope: any) {
  return (
    <scope theme={reactive({ dark: false })} user={{ name: 'Alice' }}>
      <Dashboard />
    </scope>
  )
}

// Dashboard and all descendants can read scope.theme and scope.user`

export default function DirectivesPage() {
  return (
    <article>
      <h1>Directives</h1>
      <p>
        Built-in JSX directives for conditional rendering, list rendering,
        and dynamic component switching. These are handled at the reconciler
        level — not as components.
      </p>

      <Section title="if= / else">
        <p>
          Conditionally render an element. When the condition is falsy, the element
          is removed from the DOM entirely (not hidden). An adjacent <code>else</code>
          element renders when the preceding <code>if=</code> is falsy.
        </p>
        <Code code={ifDirective} lang="tsx" />
      </Section>

      <Section title="when= (dynamic switch)">
        <p>
          <code>{'<dynamic when={...}>'}</code> renders one branch from a map of
          key → factory functions. Only the active branch exists in the DOM.
          Switching is reactive — change the key and the DOM updates.
        </p>
        <Code code={whenDirective} lang="tsx" />
      </Section>

      <Section title="for (list rendering)">
        <p>
          <code>{'<for each={array}>'}</code> renders a child for each item in a
          reactive array. Mutations (push, splice, reassign) update only the
          affected DOM nodes — no full list re-render.
        </p>
        <Code code={forDirective} lang="tsx" />
      </Section>

      <Section title="dynamic">
        <Code code={dynamicDirective} lang="tsx" />
      </Section>

      <Section title="fragment">
        <Code code={fragmentDirective} lang="tsx" />
      </Section>

      <Section title="scope">
        <p>
          <code>{'<scope>'}</code> injects values into the scope chain without
          adding a DOM wrapper element. All descendants inherit the injected values.
        </p>
        <Code code={scopeDirective} lang="tsx" />
      </Section>
    </article>
  )
}

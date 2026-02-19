import { A } from '@pounce/kit'
import { Code, Section } from '../../components'

const reactivityExample = `import { reactive, effect } from 'mutts'

const state = reactive({ count: 0, name: 'World' })

// Runs whenever state.count changes
effect(() => {
  console.log('Count is now:', state.count)
})

state.count++  // logs: "Count is now: 1"`

const componentExample = `// Components are plain functions: (props, env) => JSX.Element
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>
}

// The Babel plugin wraps {name} into r(() => name)
// so if name is reactive, the text node updates automatically.`

const twoWayExample = `function LoginForm() {
  const form = reactive({ email: '', password: '' })

  return (
    <form>
      {/* value={form.email} becomes a two-way binding automatically */}
      <input type="email" value={form.email} placeholder="Email" />
      <input type="password" value={form.password} placeholder="Password" />
      <button type="submit">Log in</button>
    </form>
  )
}`

const scopeExample = `import { extend } from '@pounce/core'

// Parent injects "theme" into env
function App(_props: {}, env: Record<string, any>) {
  extend(env, { theme: reactive({ dark: false }) })
  return <Layout />
}

// Any descendant reads it from env — no prop drilling
function ThemeButton(_props: {}, env: Record<string, any>) {
  return (
    <button onClick={() => env.theme.dark = !env.theme.dark}>
      Toggle theme
    </button>
  )
}`

const directivesExample = `// Conditional rendering
<div if={state.loggedIn}>Welcome back!</div>
<div else>Please log in.</div>

// Reactive switch
<dynamic when={state.view}>
  {{
    home: () => <HomePage />,
    about: () => <AboutPage />,
  }}
</dynamic>

// List rendering
<for each={state.items}>{(item) =>
  <li>{item.name}</li>
}</for>`

export default function ConceptsPage() {
  return (
    <article>
      <h1>Core Concepts</h1>
      <p>The mental model behind Pounce: reactivity, components, env, and directives.</p>

      <Section title="Reactivity">
        <p>
          Pounce's reactivity comes from <code>mutts</code>. Wrap an object
          in <code>reactive()</code> and any property access is tracked. When a
          tracked property changes, only the specific DOM nodes or effects that
          read it are updated — no diffing, no re-renders.
        </p>
        <Code code={reactivityExample} lang="tsx" />
      </Section>

      <Section title="Components">
        <p>
          A Pounce component is a plain function that receives <code>props</code> and <code>env</code>
          and returns JSX. <strong>Components render once.</strong> The Babel plugin wraps
          JSX expressions in <code>r()</code> calls that create fine-grained reactive subscriptions.
        </p>
        <Code code={componentExample} lang="tsx" />
        <p>
          Because the component body runs only once, you can safely declare local state,
          set up effects, and attach event handlers without worrying about stale closures.
        </p>
      </Section>

      <Section title="Two-Way Binding">
        <p>
          The Babel plugin detects member expressions in JSX attributes and generates
          both a getter and a setter. For <code>value={'{'}form.email{'}'}</code>, it produces
          a <code>ReactiveProp</code> with <code>get: () =&gt; form.email</code> and <code>set: (v) =&gt; form.email = v</code>.
          The DOM element reads the getter and writes back via the setter on user input.
        </p>
        <Code code={twoWayExample} lang="tsx" />
      </Section>

      <Section title="Env">
        <p>
          Env is a prototype-chained reactive object passed as the second argument to every component.
          Use <code>extend(env, {'{ ... }'})</code> to inject values that any descendant can read — no
          Context providers, no prop drilling.
        </p>
        <Code code={scopeExample} lang="tsx" />
      </Section>

      <Section title="Directives">
        <p>
          Pounce provides built-in JSX directives for control flow. These are
          handled at the reconciler level, not as components.
        </p>
        <Code code={directivesExample} lang="tsx" />
        <p>See <A href="/core/directives">Directives</A> for the full reference.</p>
      </Section>
    </article>
  )
}

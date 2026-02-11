import { Code, Section } from '../../components'

const scopeBasics = `// Every component receives scope as its second argument.
// Scope is a prototype-chained reactive object.

function Parent(_props: {}, scope: Scope) {
  // extend() creates a new scope that inherits from the parent
  extend(scope, { theme: reactive({ dark: false }) })
  return <Child />
}

function Child(_props: {}, scope: Scope) {
  // Child can read scope.theme — inherited via prototype chain
  return <span>{scope.theme.dark ? 'Dark' : 'Light'}</span>
}`

const extendFunction = `import { extend } from '@pounce/core'
import { reactive } from 'mutts'

// extend(base, added) creates:
//   reactive(Object.create(base, descriptors(added)))
//
// The result is a new reactive object whose prototype is base.
// Property lookups walk the chain — just like JS prototype inheritance.

function App(_props: {}, scope: Scope) {
  // Inject user and theme into scope for all descendants
  extend(scope, {
    user: reactive({ name: 'Alice', role: 'admin' }),
    theme: reactive({ dark: false, accent: 'blue' }),
  })

  return <Dashboard />
}`

const scopeElement = `// <scope> is a built-in intrinsic that injects values
// without adding a DOM wrapper element.

function App() {
  return (
    <scope
      user={reactive({ name: 'Alice' })}
      config={{ apiUrl: '/api' }}
    >
      {/* All children inherit user and config in their scope */}
      <Header />
      <Main />
      <Footer />
    </scope>
  )
}

// Equivalent to calling extend(scope, { user, config })
// inside a wrapper component, but without the extra component.`

const rootScope = `import { rootScope } from '@pounce/core'

// rootScope is the top-level scope object.
// bindApp() passes it (or a child of it) to the root component.
// You can pre-populate it before mounting:

rootScope.apiUrl = '/api/v2'
rootScope.debug = true

bindApp(<App />, '#app')
// App's scope inherits from rootScope`

export default function ScopePage() {
  return (
    <article>
      <h1>Scope</h1>
      <p>
        Scope is Pounce's dependency injection mechanism. It's a prototype-chained
        reactive object passed to every component — no Context providers, no prop drilling.
      </p>

      <Section title="How Scope Works">
        <p>
          Every component receives <code>scope</code> as its second parameter.
          When a parent calls <code>extend(scope, {'{ ... }'})</code>, it creates a new
          scope object whose prototype is the parent's scope. Descendants inherit
          all values via JavaScript's prototype chain.
        </p>
        <Code code={scopeBasics} lang="tsx" />
      </Section>

      <Section title="extend()">
        <p>
          <code>extend(base, added)</code> creates a reactive object with <code>base</code>
          as its prototype and <code>added</code> as own properties. Property lookups
          walk the prototype chain — reads are reactive at every level.
        </p>
        <Code code={extendFunction} lang="tsx" />
      </Section>

      <Section title="<scope> Element">
        <p>
          The <code>{'<scope>'}</code> intrinsic injects values into the scope chain
          without adding a DOM wrapper. It's syntactic sugar for creating a wrapper
          component that calls <code>extend()</code>.
        </p>
        <Code code={scopeElement} lang="tsx" />
      </Section>

      <Section title="Root Scope">
        <p>
          <code>rootScope</code> is the top-level scope. You can pre-populate it
          before mounting the app.
        </p>
        <Code code={rootScope} lang="tsx" />
      </Section>
    </article>
  )
}

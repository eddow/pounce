import { Code, Section } from '../../components'

const envBasics = `// Every component receives env as its second argument.
// Env is a prototype-chained reactive object.

function Parent(_props: {}, env: Env) {
  // extend() creates a new env that inherits from the parent
  extend(env, { theme: reactive({ dark: false }) })
  return <Child />
}

function Child(_props: {}, env: Env) {
  // Child can read env.theme — inherited via prototype chain
  return <span>{env.theme.dark ? 'Dark' : 'Light'}</span>
}`

const extendFunction = `import { extend } from '@pounce'
import { reactive } from 'mutts'

// extend(base, added) creates:
//   reactive(Object.create(base, descriptors(added)))
//
// The result is a new reactive object whose prototype is base.
// Property lookups walk the chain — just like JS prototype inheritance.

function App(_props: {}, env: Env) {
  // Inject user and theme into env for all descendants
  extend(env, {
    user: reactive({ name: 'Alice', role: 'admin' }),
    theme: reactive({ dark: false, accent: 'blue' }),
  })

  return <Dashboard />
}`

const envElement = `// <env> is a built-in intrinsic that injects values
// without adding a DOM wrapper element.

function App() {
  return (
    <env
      user={reactive({ name: 'Alice' })}
      config={{ apiUrl: '/api' }}
    >
      {/* All children inherit user and config in their env */}
      <Header />
      <Main />
      <Footer />
    </env>
  )
}

// Equivalent to calling extend(env, { user, config })
// inside a wrapper component, but without the extra component.`

const rootEnv = `import { rootEnv } from '@pounce'

// rootEnv is the top-level env object.
// latch() passes it (or a child of it) to the root component.
// You can pre-populate it before mounting:

rootEnv.apiUrl = '/api/v2'
rootEnv.debug = true

latch('#app', <App />)
// App's env inherits from rootEnv`

export default function EnvPage() {
	return (
		<article>
			<h1>Env</h1>
			<p>
				Env is Pounce's dependency injection mechanism. It's a prototype-chained reactive object
				passed to every component — no Context providers, no prop drilling.
			</p>

			<Section title="How Env Works">
				<p>
					Every component receives <code>env</code> as its second parameter. When a parent calls{' '}
					<code>extend(env, {'{ ... }'})</code>, it creates a new env object whose prototype is the
					parent's env. Descendants inherit all values via JavaScript's prototype chain.
				</p>
				<Code code={envBasics} lang="tsx" />
			</Section>

			<Section title="extend()">
				<p>
					<code>extend(base, added)</code> creates a reactive object with <code>base</code>
					as its prototype and <code>added</code> as own properties. Property lookups walk the
					prototype chain — reads are reactive at every level.
				</p>
				<Code code={extendFunction} lang="tsx" />
			</Section>

			<Section title="<env> Element">
				<p>
					The <code>{'<env>'}</code> intrinsic injects values into the env chain without adding a
					DOM wrapper. It's syntactic sugar for creating a wrapper component that calls{' '}
					<code>extend()</code>.
				</p>
				<Code code={envElement} lang="tsx" />
			</Section>

			<Section title="Root Env">
				<p>
					<code>rootEnv</code> is the top-level env. You can pre-populate it before mounting the
					app.
				</p>
				<Code code={rootEnv} lang="tsx" />
			</Section>
		</article>
	)
}

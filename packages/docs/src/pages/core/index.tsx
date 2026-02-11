import { A } from '@pounce/kit'
import { PackageHeader, Section, Code } from '../../components'

const bindAppExample = `import { bindApp } from '@pounce/core'

function App() {
  return <h1>Hello!</h1>
}

// Mount to a CSS selector (default: '#app')
bindApp(<App />)

// Or to a specific element
bindApp(<App />, document.getElementById('root')!)

// Returns a cleanup function
const unmount = bindApp(<App />, '#app')
unmount() // removes the app`

export default function CorePage() {
  return (
    <article>
      <PackageHeader
        name="@pounce/core"
        description="JSX factory, PounceElement, reactivity integration, scope, reconciler, and directives."
      />

      <p>
        <code>@pounce/core</code> is the foundation of every Pounce application.
        It provides the JSX factory (<code>h()</code>), the element abstraction
        (<code>PounceElement</code>), the reconciler that syncs reactive state to
        the DOM, and built-in directives for control flow.
      </p>

      <Section title="Entry Point">
        <p>
          <code>bindApp()</code> mounts a Pounce component tree into the DOM.
          It sets up the root scope and starts the reactive rendering pipeline.
        </p>
        <Code code={bindAppExample} lang="tsx" />
      </Section>

      <Section title="Architecture">
        <p>Pounce's rendering pipeline:</p>
        <ol>
          <li><strong>Babel plugin</strong> transforms JSX — wraps expressions in <code>r()</code>, generates two-way bindings</li>
          <li><strong><code>h()</code></strong> creates <code>PounceElement</code> descriptors (not DOM nodes yet)</li>
          <li><strong><code>PounceElement.render()</code></strong> produces real DOM nodes inside a <code>mutts</code> effect</li>
          <li><strong>Reconciler</strong> (<code>reconcile</code>) syncs children to the DOM — <code>latch()</code> is the public API for latching content onto any element</li>
          <li><strong>Reactive updates</strong> — when a <code>mutts</code> dependency changes, only the specific text node, attribute, or child list updates</li>
        </ol>
      </Section>

      <Section title="Topics">
        <ul>
          <li><A href="/core/jsx">JSX Factory</A> — <code>h()</code>, <code>r()</code>, <code>ReactiveProp</code>, two-way binding</li>
          <li><A href="/core/components">Components</A> — <code>PounceElement</code>, render lifecycle, mount/use callbacks</li>
          <li><A href="/core/directives">Directives</A> — <code>if</code>, <code>when</code>, <code>for</code>, <code>dynamic</code></li>
          <li><A href="/core/scope">Scope</A> — prototype chain, <code>extend()</code>, <code>{'<scope>'}</code> element</li>
          <li><A href="/core/compose">Compose</A> — <code>compose()</code>, <code>forwardProps()</code>, <code>propsInto()</code></li>
          <li><A href="/core/ssr">SSR</A> — Node entry point, JSDOM, AsyncLocalStorage</li>
        </ul>
      </Section>
    </article>
  )
}

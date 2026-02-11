import { A } from '@pounce/kit'
import { Code, Section } from '../components'

const helloApp = `import { bindApp } from '@pounce/core'
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'
import '@picocss/pico/css/pico.min.css'

setAdapter(picoAdapter)

const Counter = () => {
  const state = reactive({ count: 0 })
  return (
    <button onClick={() => state.count++}>
      Clicked {state.count} times
    </button>
  )
}

bindApp(<Counter />, '#app')`

export default function IndexPage() {
  return (
    <article>
      <h1>Pounce</h1>
      <p>
        A <strong>component-oriented UI framework</strong> with fine-grained reactivity
        and direct DOM manipulation. Familiar JSX syntax, no virtual DOM.
      </p>

      <Section title="Packages">
        <table>
          <thead><tr><th>Package</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><A href="/core"><code>@pounce/core</code></A></td><td>JSX factory, reactivity, directives, scope, two-way binding</td></tr>
            <tr><td><A href="/kit"><code>@pounce/kit</code></A></td><td>Router, client state, storage, Intl, API utilities</td></tr>
            <tr><td><A href="/ui"><code>@pounce/ui</code></A></td><td>15+ components, overlays, display context, adapter pattern</td></tr>
            <tr><td><code>@pounce/board</code></td><td>Full-stack meta-framework: file-based routing, SSR, middleware</td></tr>
            <tr><td><code>@pounce/adapter-pico</code></td><td>PicoCSS adapter: variants, bridge CSS, tooltip, icons</td></tr>
            <tr><td><code>mutts</code></td><td>Reactive primitives: signals, effects, reactive objects/arrays/sets/maps</td></tr>
            <tr><td><code>pure-glyf</code></td><td>Icon system: SVG → CSS classes, Vite plugin</td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="Quick Start">
        <Code code="pnpm add @pounce/core @pounce/kit @pounce/ui @pounce/adapter-pico @picocss/pico mutts" lang="bash" />
        <Code code={helloApp} lang="tsx" />
      </Section>

      <Section title="Key Ideas">
        <ul>
          <li><strong>Components render once</strong> — no re-renders, no diffing. Reactivity is fine-grained via <code>mutts</code>.</li>
          <li><strong>Two-way binding by default</strong> — the Babel plugin auto-generates getter/setter pairs for JSX attributes.</li>
          <li><strong>Scope inheritance</strong> — prototype-chained reactive context, no prop drilling.</li>
          <li><strong>Adapter pattern</strong> — swap CSS frameworks without changing component code.</li>
          <li><strong>Direct DOM</strong> — no virtual DOM. PounceElement manages real nodes directly.</li>
        </ul>
      </Section>
    </article>
  )
}


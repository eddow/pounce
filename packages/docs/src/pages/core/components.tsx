import { Code, Section, ApiTable } from '../../components'

const componentSignature = `// A Pounce component is a plain function:
function MyComponent(props: MyProps, env: Env): JSX.Element {
  // Body runs ONCE — no re-renders.
  // All reactivity comes from r() wrappers in JSX.
  return <div>{props.title}</div>
}

// Arrow function form:
const Greeting = ({ name }: { name: string }) => <h1>Hello, {name}!</h1>`

const pounceElement = `// PounceElement is the core abstraction.
// h() creates PounceElements, render() produces DOM nodes.

class PounceElement {
  // The produce function creates real DOM nodes
  produce: (env?: Env) => Node | readonly Node[]

  // Render with caching — same element always returns same nodes
  render(env?: Env): Node | readonly Node[]

  // Lifecycle
  mount?: ((target: Node) => ScopedCallback)[]

  // Conditional rendering
  condition?: () => any
  if?: Record<string, () => any>
  when?: Record<string, () => any>
  else?: true
}`

const lifecycleExample = `function AutoFocus() {
  return (
    <input
      use:focus={(el: HTMLInputElement) => {
        // Called after the element is mounted in the DOM.
        el.focus()

        // Return a cleanup function (optional)
        return () => console.log('input removed')
      }}
    />
  )
}

// use= (without namespace) receives the raw element:
function MeasureSize() {
  let div: HTMLDivElement
  return (
    <div
      this={div}
      use={(el: HTMLDivElement) => {
        console.log('Mounted, size:', el.getBoundingClientRect())
      }}
    >
      Content
    </div>
  )
}`

const renderOnce = `// WRONG — bare reactive read in component body:
function Bad() {
  const state = reactive({ count: 0 })
  console.log(state.count) // ⚠️ triggers rebuild fence warning
  return <span>{state.count}</span>
}

// RIGHT — use effect() for side effects:
function Good() {
  const state = reactive({ count: 0 })
  effect(() => {
    console.log(state.count) // ✅ runs in its own effect
  })
  return <span>{state.count}</span> // ✅ r() wrapper handles reactivity
}`

export default function ComponentsPage() {
  return (
    <article>
      <h1>Components</h1>
      <p>
        How Pounce components work: the render-once model, PounceElement,
        and lifecycle callbacks.
      </p>

      <Section title="Component Signature">
        <p>
          A component is a function that takes <code>props</code> and <code>env</code>
          and returns JSX. The body executes <strong>exactly once</strong> — there are no
          re-renders. The Babel plugin's <code>r()</code> wrappers handle all reactive updates
          at the individual node/attribute level.
        </p>
        <Code code={componentSignature} lang="tsx" />
      </Section>

      <Section title="PounceElement">
        <p>
          <code>PounceElement</code> is the internal abstraction that bridges JSX descriptors
          and real DOM nodes. When <code>h()</code> encounters a component function, it wraps
          the component call in a PounceElement whose <code>produce</code> function invokes
          the component inside a <code>mutts</code> effect with a rebuild fence.
        </p>
        <Code code={pounceElement} lang="tsx" />
        <p>
          Render results are cached in a static WeakMap — calling <code>render()</code> twice
          on the same PounceElement returns the same DOM nodes.
        </p>
      </Section>

      <Section title="Render Once">
        <p>
          Because the component body runs inside a rebuild fence, bare reactive reads
          in the body trigger a warning. All reactivity must go through JSX expressions
          (auto-wrapped by Babel) or explicit <code>effect()</code> calls.
        </p>
        <Code code={renderOnce} lang="tsx" />
      </Section>

      <Section title="Lifecycle: use= and mount">
        <p>
          The <code>use:</code> directive (or plain <code>use=</code>) registers a callback
          that runs after the element is mounted in the DOM. Return a cleanup function
          to run when the element is removed.
        </p>
        <Code code={lifecycleExample} lang="tsx" />
      </Section>

      <Section title="PounceElement API">
        <ApiTable props={[
          { name: 'produce', type: '(env?) => Node | Node[]', description: 'Creates real DOM nodes from the element descriptor', required: true },
          { name: 'render', type: '(env?) => Node | Node[]', description: 'Cached version of produce — same element always returns same nodes', required: true },
          { name: 'mount', type: '((Node) => cleanup)[]', description: 'Callbacks invoked after DOM insertion', required: false },
          { name: 'condition', type: '() => any', description: 'Reactive condition for if=/when= directives', required: false },
          { name: 'tag', type: 'string | ComponentFunction', description: 'The element tag or component function (for debugging)', required: false },
        ]} />
      </Section>
    </article>
  )
}

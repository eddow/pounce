import { Code, Section, ApiTable } from '../../components'

const composeBasics = `import { compose } from '@pounce/core'

// compose() merges multiple objects into a single reactive object.
// It's used internally by the Babel plugin when spreading props.

const base = { color: 'red', size: 'md' }
const overrides = { color: 'blue', variant: 'primary' }

const merged = compose(base, overrides)
// { color: 'blue', size: 'md', variant: 'primary' }

// If any source is reactive, the merged result tracks changes.
// The Babel plugin converts Object.assign / _extends in h() calls
// to compose() automatically.`

const forwardPropsExample = `import { forwardProps } from '@pounce/core'

// forwardProps() splits props into "known" and "rest".
// Known props are consumed by the component; rest are forwarded
// to the underlying DOM element.

function MyButton(props: { variant?: string; children: any } & JSX.IntrinsicElements['button']) {
  const [own, rest] = forwardProps(props, ['variant', 'children'])

  return (
    <button class={own.variant === 'primary' ? 'btn-primary' : 'btn'} {...rest}>
      {own.children}
    </button>
  )
}

// Usage:
// <MyButton variant="primary" disabled onClick={handleClick}>Save</MyButton>
// own = { variant: 'primary', children: 'Save' }
// rest = { disabled: true, onClick: handleClick }`

const propsIntoExample = `import { propsInto } from '@pounce/core'

// propsInto() copies reactive prop values into a target object.
// Useful for building internal state from props.

function Slider(props: { min?: number; max?: number; value?: number }) {
  const state = reactive({ min: 0, max: 100, value: 50 })
  propsInto(state, props)
  // state now tracks props reactively — if props.value changes,
  // state.value updates too.

  return <input type="range" min={state.min} max={state.max} value={state.value} />
}`

const defaultedExample = `import { defaulted } from '@pounce/core'

// defaulted() sets prototype-based defaults on a props object.
// Missing props fall through to the defaults via prototype chain.

function Card(props: { title?: string; padding?: string }) {
  const p = defaulted(props, { title: 'Untitled', padding: '1rem' })
  // p.title is 'Untitled' if not provided
  // p.padding is '1rem' if not provided

  return (
    <div style={{ padding: p.padding }}>
      <h3>{p.title}</h3>
    </div>
  )
}`

export default function ComposePage() {
  return (
    <article>
      <h1>Compose Utilities</h1>
      <p>
        Utilities for merging, forwarding, and defaulting props in Pounce components.
      </p>

      <Section title="compose()">
        <p>
          Merges multiple objects into a single reactive result. The Babel plugin
          automatically converts <code>Object.assign</code> and spread operators
          in <code>h()</code> calls to <code>compose()</code>.
        </p>
        <Code code={composeBasics} lang="tsx" />
      </Section>

      <Section title="forwardProps()">
        <p>
          Splits a props object into known props (consumed by the component) and
          rest props (forwarded to the underlying element). Essential for wrapper
          components that need to pass through HTML attributes.
        </p>
        <Code code={forwardPropsExample} lang="tsx" />
      </Section>

      <Section title="propsInto()">
        <p>
          Copies reactive prop values into a target object. The target tracks
          changes from the source reactively.
        </p>
        <Code code={propsIntoExample} lang="tsx" />
      </Section>

      <Section title="defaulted()">
        <p>
          Sets prototype-based defaults. Missing props fall through to defaults
          via the prototype chain — no spreading, no copying.
        </p>
        <Code code={defaultedExample} lang="tsx" />
      </Section>

      <Section title="API Reference">
        <ApiTable props={[
          { name: 'compose(...sources)', type: '(...object[]) => object', description: 'Merge objects into a single reactive result', required: false },
          { name: 'forwardProps(props, keys)', type: '(P, string[]) => [own, rest]', description: 'Split props into known and forwarded sets', required: false },
          { name: 'propsInto(target, source)', type: '(T, Partial<T>) => void', description: 'Copy reactive prop values into target object', required: false },
          { name: 'defaulted(props, defaults)', type: '(T, D) => T & Required<D>', description: 'Set prototype-based defaults on props', required: false },
          { name: 'extend(base, added)', type: '(B, A) => B & A', description: 'Create reactive object with base as prototype', required: false },
        ]} />
      </Section>
    </article>
  )
}

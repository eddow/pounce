import { ApiTable, Code, Section } from '../../components'

const hFunction = `import { h, r } from '@sursaut'

// JSX is syntactic sugar for h() calls:
// <div class="box">Hello</div>
// becomes:
h('div', { class: 'box' }, 'Hello')

// Components:
// <MyComponent name="World" />
// becomes:
h(MyComponent, { name: 'World' })`

const reactiveProp = `import { r } from '@sursaut'

// The Babel plugin wraps JSX expressions automatically:
// <span>{state.count}</span>
// becomes:
h('span', null, r(() => state.count))

// r() creates a ReactiveProp — a getter (and optional setter)
// that the reconciler subscribes to for fine-grained updates.

// Two-way binding for member expressions:
// <input value={form.name} />
// becomes:
h('input', { value: r(() => form.name, (v) => form.name = v) })`

const thisAttribute = `// this= captures a reference to the rendered DOM element.
// The plugin generates a plain setter callback (no r() involved):
let inputEl: HTMLInputElement

// <input this={inputEl} />
// becomes:
h('input', { this: (mounted) => inputEl = mounted })

// After render, inputEl holds the real DOM element.
// On unmount, the callback is called with undefined.

// Any LVal works — including computed member expressions:
const refs: HTMLElement[] = []
// <li this={refs[i]} />  →  (mounted) => refs[i] = mounted

// You can also pass a function directly:
// <input this={(el) => console.log('mounted', el)} />`

const twoWayDetails = `// The Babel plugin generates two-way bindings for:
// 1. Member expressions: obj.prop, obj[index], deep.nested.value
// 2. Mutable bare identifiers: let/var variables
// 3. Input elements: <input>, <textarea>, <select>

// For <input>, the plugin also wires up the DOM event listener:
// - <input value={state.text} />  → listens on 'input' event
// - <textarea value={state.text} /> → listens on 'input' event
// - <select value={state.choice} /> → listens on 'change' event

// update: prefix for explicit setter pairing:
// <Slider value={pos.x} update:value={(v) => pos.x = clamp(v, 0, 100)} />
// The plugin merges these into a single r(getter, customSetter).`

export default function JsxPage() {
	return (
		<article>
			<h1>JSX Factory</h1>
			<p>How Sursaut transforms JSX into reactive DOM elements.</p>

			<Section title="The h() Function">
				<p>
					Sursaut's <code>h()</code> function is the JSX factory. It creates
					<code>SursautElement</code> descriptors — lightweight objects that describe what to
					render. Actual DOM nodes are created lazily during <code>render()</code>.
				</p>
				<Code code={hFunction} lang="tsx" />
			</Section>

			<Section title="ReactiveProp and r()">
				<p>
					<code>r()</code> creates a <code>ReactiveProp</code> — a wrapper around a getter (and
					optional setter) that the rendering pipeline subscribes to. When the getter's dependencies
					change, only the specific DOM node or attribute updates.
				</p>
				<Code code={reactiveProp} lang="tsx" />
				<p>
					<strong>
						You never write <code>r()</code> manually.
					</strong>{' '}
					The Babel plugin handles all wrapping. Writing{' '}
					<code>
						{'{'}() =&gt; expr{'}'}
					</code>{' '}
					in JSX would double-wrap and break reactivity.
				</p>
			</Section>

			<Section title="Two-Way Binding">
				<p>
					When the Babel plugin sees an assignable expression in a JSX attribute — a member
					expression (<code>obj.prop</code>, <code>obj[i]</code>) or a mutable identifier (
					<code>let</code>/<code>var</code>) — it generates both a getter and a setter. This enables
					automatic two-way binding.
				</p>
				<Code code={twoWayDetails} lang="tsx" />
			</Section>

			<Section title="this= Attribute">
				<p>
					The <code>this=</code> attribute captures a reference to the rendered DOM element. It's a
					set-only binding — the plugin generates a setter that assigns the element after rendering.
				</p>
				<Code code={thisAttribute} lang="tsx" />
			</Section>

			<Section title="Babel Plugin Summary">
				<ApiTable
					props={[
						{
							name: '{expr}',
							type: 'child/attr',
							description: 'Wrapped in r(() => expr) for reactive subscription',
							required: false,
						},
						{
							name: '{obj.prop}',
							type: 'attribute',
							description: 'Two-way: r(() => obj.prop, (v) => obj.prop = v). Also obj[i], let x.',
							required: false,
						},
						{
							name: 'this={ref}',
							type: 'attribute',
							description: 'Setter callback: (mounted) => ref = mounted. No r() involved.',
							required: false,
						},
						{
							name: 'update:attr',
							type: 'attribute',
							description: 'Custom setter paired with base attribute',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}

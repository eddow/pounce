import { ApiTable, Code, Section } from '../../components'

const hFunction = `import { h, r } from '@pounce'

// JSX is syntactic sugar for h() calls:
// <div class="box">Hello</div>
// becomes:
h('div', { class: 'box' }, 'Hello')

// Components:
// <MyComponent name="World" />
// becomes:
h(MyComponent, { name: 'World' })`

const reactiveProp = `import { r } from '@pounce'

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

const thisAttribute = `// this= is a set-only binding for element references:
let inputEl: HTMLInputElement

// <input this={inputEl} />
// becomes:
h('input', { this: r(() => undefined, (v) => inputEl = v) })

// After render, inputEl holds the real DOM element.`

const twoWayDetails = `// The Babel plugin generates two-way bindings for:
// 1. Member expressions: obj.prop, arr[i], deep.nested.value
// 2. Input elements: <input>, <textarea>, <select>

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
			<p>How Pounce transforms JSX into reactive DOM elements.</p>

			<Section title="The h() Function">
				<p>
					Pounce's <code>h()</code> function is the JSX factory. It creates
					<code>PounceElement</code> descriptors — lightweight objects that describe what to render.
					Actual DOM nodes are created lazily during <code>render()</code>.
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
					When the Babel plugin sees a member expression in a JSX attribute, it generates both a
					getter and a setter. This enables automatic two-way binding for form elements.
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
							description: 'Two-way: r(() => obj.prop, (v) => obj.prop = v)',
							required: false,
						},
						{
							name: 'this={ref}',
							type: 'attribute',
							description: 'Set-only: r(() => undefined, (v) => ref = v)',
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

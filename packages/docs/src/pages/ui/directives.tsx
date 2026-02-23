import { Code, PackageHeader, Section } from '../../components'

const installSnippet = `import { rootEnv, directives } from '@pounce'

// Add all directives to the root env
Object.assign(rootEnv, directives)`

const loadingSnippet = `<button use:loading={state.saving}>
  Submit
</button>`

const badgeSnippet = `// String or number value
<div use:badge="5">Notifications</div>

// Full options
<div use:badge={{
  value: 'New',
  position: 'top-left',
  variant: 'success'
}}>
  Dashboard
</div>`

const intersectSnippet = `<div use:intersect={{
  onEnter: () => console.log('Entered!'),
  onLeave: () => console.log('Left!'),
  threshold: 0.5
}}>
  Scroll to see me
</div>`

const resizeSnippet = `const size = reactive({ width: 0, height: 0 })

// Bi-directional binding
<div use:resize={size} style={{ border: '1px solid black' }}>
  Size: {size.width} x {size.height}
</div>

// Callback form
<div use:resize={(w, h) => console.log(w, h)}>
  Resizable area
</div>`

const pointerSnippet = `const pointer = reactive({ value: undefined })

<div use:pointer={pointer}>
  {pointer.value ? \`X: \${pointer.value.x} Y: \${pointer.value.y}\` : 'Move mouse here'}
</div>`

const scrollSnippet = `const scroll = reactive({
  y: { value: 0, max: 0 }
})

<div use:scroll={{ y: scroll.y }} style="height: 200px; overflow: auto">
  <div style="height: 1000px">
    Scroll position: {scroll.y.value} / {scroll.y.max}
  </div>
</div>`

const trailSnippet = `<div use:tail style="height: 200px; overflow: auto">
  <for each={messages}>{(msg) => <p>{msg}</p>}</for>
</div>`

const sizeableSnippet = `function SidebarLayout() {
  const state = stored({ width: 300 })

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside use:sizeable={state.width}>
        Sidebar Content
      </aside>
      <main style={{ flex: 1 }}>
        Main Content
      </main>
    </div>
  )
}`

const sizeableOptionsSnippet = `/* CSS controls min/max via clamp() on the parent */
.my-layout {
  --sizeable-width: 300px;
  grid-template-columns: clamp(180px, var(--sizeable-width), 520px) 1fr;
}

/* Customize handle size */
.my-layout {
  --pounce-resize-handle-width: 8px;
}`

export default function UiDirectivesPage() {
	return (
		<article>
			<PackageHeader
				name="UI Directives"
				description="Behavioral directives for interaction tracking, layout observation, and state feedback."
			/>

			<Section title="Installation">
				<p>
					UI directives must be registered in the env to be available in JSX via the{' '}
					<code>use:name</code> syntax. The easiest way is to assign the <code>directives</code>{' '}
					namespace export into the root env.
				</p>
				<Code code={installSnippet} lang="tsx" />
			</Section>

			<Section title="loading">
				<p>
					Sets <code>aria-busy="true"</code>, adds loading classes, and automatically disables form
					elements (buttons, inputs, etc.) when the value is true. It's compatible with PicoCSS's
					native spinner.
				</p>
				<Code code={loadingSnippet} lang="tsx" />
			</Section>

			<Section title="badge">
				<p>
					Adds a floating badge overlay to an element. Supports custom positioning and variants.
				</p>
				<Code code={badgeSnippet} lang="tsx" />
			</Section>

			<Section title="intersect">
				<p>
					Wraps <code>IntersectionObserver</code> to track when an element enters or leaves the
					viewport.
				</p>
				<Code code={intersectSnippet} lang="tsx" />
			</Section>

			<Section title="resize">
				<p>
					Wraps <code>ResizeObserver</code>. Supports bi-directional binding to a reactive object or
					a callback function.
				</p>
				<Code code={resizeSnippet} lang="tsx" />
			</Section>

			<Section title="pointer">
				<p>Tracks pointer (mouse/touch) coordinates and button state relative to the element.</p>
				<Code code={pointerSnippet} lang="tsx" />
			</Section>

			<Section title="scroll">
				<p>
					Provides reactive scroll position tracking and bi-directional scroll control. Can also
					track the maximum scrollable range.
				</p>
				<Code code={scrollSnippet} lang="tsx" />
			</Section>

			<Section title="tail">
				<p>
					Auto-scrolls a container to the bottom when content grows (e.g. for chat logs), unless the
					user has scrolled up to read history.
				</p>
				<Code code={trailSnippet} lang="tsx" />
			</Section>

			<Section title="sizeable">
				<p>
					Makes an element resizable by dragging its edge. Pass a reactive number as the value — it
					is read for initialization and written back on every resize.
				</p>
				<p>
					The directive auto-detects the layout direction and finds the single <code>flex: 1</code>{' '}
					sibling to determine which edge gets the handle. Min/max constraints are handled entirely
					in CSS via <code>clamp()</code>.
				</p>
				<Code code={sizeableSnippet} lang="tsx" />
				<Section title="CSS Variables">
					<Code code={sizeableOptionsSnippet} lang="css" />
					<ul>
						<li>
							<code>--sizeable-width</code> / <code>--sizeable-height</code> — set on the parent,
							updated during drag
						</li>
						<li>
							<code>--pounce-resize-handle-width</code> / <code>--pounce-resize-handle-height</code>{' '}
							— handle hit area (default: 5px)
						</li>
					</ul>
				</Section>
			</Section>
		</article>
	)
}

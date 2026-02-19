import { Code, PackageHeader, Section } from '../../components'

const adapterSetup = `import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'
import '@picocss/pico/css/pico.min.css'

// Install the PicoCSS adapter — all components
// inherit PicoCSS theming automatically.
setAdapter(picoAdapter)`

const buttonExample = `import { Button } from '@pounce/ui'

// Variants via the adapter pattern:
<Button variant="primary">Save</Button>
<Button variant="danger">Delete</Button>
<Button variant="success">Confirm</Button>

// Loading state via directive (inject loading into env first):
<Button use:loading={state.saving}>Submitting...</Button>

// With icons (via pure-glyf):
<Button icon="check">Save</Button>`

const overlayExample = `import { StandardOverlays } from '@pounce/ui'

// Wrap your app with StandardOverlays:
<StandardOverlays>
  <App />
</StandardOverlays>

// Then use env.dialog / env.toast / env.drawer:
env.toast.success('Saved!')
env.toast.error('Something went wrong')

env.dialog({ title: 'Confirm', message: 'Are you sure?' })

env.drawer({ children: <SettingsPanel />, side: 'right' })`

const displayContext = `import { DisplayProvider, ThemeToggle } from '@pounce/ui'

// DisplayProvider manages theme state (light/dark)
// and provides display context to all descendants.

function App() {
  return (
    <DisplayProvider>
      <Layout />
      <ThemeToggle />
    </DisplayProvider>
  )
}`

export default function UIPage() {
	return (
		<article>
			<PackageHeader
				name="@pounce/ui"
				description="15+ components, overlay system, display context, and the adapter pattern."
			/>

			<p>
				<code>@pounce/ui</code> is a component library built on <code>@pounce/core</code>. It uses
				the <strong>adapter pattern</strong> to decouple component logic from CSS framework styling
				— swap PicoCSS for any other framework without changing component code.
			</p>

			<Section title="Adapter Setup">
				<p>
					Install a CSS framework adapter before using components. The adapter provides variant
					classes, transitions, and component configs.
				</p>
				<Code code={adapterSetup} lang="tsx" />
			</Section>

			<Section title="Components">
				<p>Available components:</p>
				<table>
					<thead>
						<tr>
							<th>Component</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<code>Button</code>
							</td>
							<td>Interactive button with variants, icons, loading state</td>
						</tr>
						<tr>
							<td>
								<code>ButtonGroup</code>
							</td>
							<td>Group buttons with shared styling</td>
						</tr>
						<tr>
							<td>
								<code>Accordion</code>
							</td>
							<td>Collapsible content section</td>
						</tr>
						<tr>
							<td>
								<code>Card</code>
							</td>
							<td>Content container with header/footer slots</td>
						</tr>
						<tr>
							<td>
								<code>Menu</code>
							</td>
							<td>Navigation menu with keyboard support</td>
						</tr>
						<tr>
							<td>
								<code>Dialog</code>
							</td>
							<td>Modal dialog with backdrop and focus trap</td>
						</tr>
						<tr>
							<td>
								<code>Toast</code>
							</td>
							<td>Notification toasts with variants</td>
						</tr>
						<tr>
							<td>
								<code>Drawer</code>
							</td>
							<td>Slide-out panel (left/right)</td>
						</tr>
						<tr>
							<td>
								<code>Progress</code>
							</td>
							<td>Progress bar with indeterminate mode</td>
						</tr>
						<tr>
							<td>
								<code>InfiniteScroll</code>
							</td>
							<td>Virtualized list with variable height</td>
						</tr>
						<tr>
							<td>
								<code>Toolbar</code>
							</td>
							<td>Horizontal toolbar with spacer</td>
						</tr>
						<tr>
							<td>
								<code>Stars</code>
							</td>
							<td>Star rating input with single or range selection</td>
						</tr>
						<tr>
							<td>
								<code>Badge</code>
							</td>
							<td>Small uppercase status label</td>
						</tr>
						<tr>
							<td>
								<code>Pill</code>
							</td>
							<td>Medium status indicator with icons</td>
						</tr>
						<tr>
							<td>
								<code>Chip</code>
							</td>
							<td>Interactive dismissible token</td>
						</tr>
						<tr>
							<td>
								<code>CheckButton</code>
							</td>
							<td>Toggle button with role="checkbox" semantics</td>
						</tr>
						<tr>
							<td>
								<code>RadioButton</code>
							</td>
							<td>Button-style radio with group/value binding</td>
						</tr>
						<tr>
							<td>
								<code>Multiselect</code>
							</td>
							<td>Dropdown multi-selection with Set binding</td>
						</tr>
						<tr>
							<td>
								<code>Heading</code>
							</td>
							<td>Semantic heading (h1–h6) with variant coloring</td>
						</tr>
						<tr>
							<td>
								<code>Text</code>
							</td>
							<td>Paragraph text with size presets and muted mode</td>
						</tr>
						<tr>
							<td>
								<code>Link</code>
							</td>
							<td>Styled anchor with client-side routing</td>
						</tr>
						<tr>
							<td>
								<code>Icon</code>
							</td>
							<td>Icon rendering via adapter factory</td>
						</tr>
						<tr>
							<td>
								<code>ErrorBoundary</code>
							</td>
							<td>Catches child rendering errors with fallback</td>
						</tr>
						<tr>
							<td>
								<code>Forms</code>
							</td>
							<td>Select, Combobox, Checkbox, Radio, Switch</td>
						</tr>
						<tr>
							<td>
								<code>Layout</code>
							</td>
							<td>Stack, Inline, Grid, AppShell, Container</td>
						</tr>
					</tbody>
				</table>
			</Section>

			<Section title="Buttons">
				<Code code={buttonExample} lang="tsx" />
			</Section>

			<Section title="Overlay System">
				<p>
					Dialogs, toasts, and drawers use a shared overlay system. Inject{' '}
					<code>StandardOverlays</code> into env to enable them.
				</p>
				<Code code={overlayExample} lang="tsx" />
			</Section>

			<Section title="Display Context">
				<p>
					<code>DisplayProvider</code> manages theme state and provides display context to all
					descendants. <code>ThemeToggle</code> switches between light and dark modes.
				</p>
				<Code code={displayContext} lang="tsx" />
			</Section>

			<Section title="Directives">
				<p>UI directives for common patterns:</p>
				<ul>
					<li>
						<code>use:badge</code> — badge overlay on any element
					</li>
					<li>
						<code>use:intersect</code> — intersection observer
					</li>
					<li>
						<code>use:loading</code> — loading state with spinner
					</li>
					<li>
						<code>use:pointer</code> — pointer event tracking
					</li>
					<li>
						<code>use:resize</code> — resize observer
					</li>
					<li>
						<code>use:scroll</code> — scroll position tracking
					</li>
				</ul>
			</Section>
		</article>
	)
}

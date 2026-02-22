import { ApiTable, Code, Section } from '../../components'

const setup = `import { StandardOverlays } from '@pounce/adapter-pico'

// StandardOverlays is a wrapper component that provides
// dialog, toast, and drawer helpers via env.
// Wrap your app (or a subtree) with it:

function App() {
  return (
    <StandardOverlays>
      <Layout />
    </StandardOverlays>
  )
}

// Inside any descendant, env.dialog / env.toast / env.drawer
// are available automatically.`

const dialogExample = `// Dialog is an imperative API — not a JSX component.
// env.dialog is injected by StandardOverlays.

// Simple message (OK button auto-added):
env.dialog('Something happened')

// With title and custom buttons:
env.dialog({
  title: 'Confirm Delete',
  message: 'This action cannot be undone.',
  buttons: {
    cancel: { text: 'Cancel', variant: 'secondary' },
    ok: { text: 'Delete', variant: 'danger' },
  },
})

// Confirm shorthand — returns Promise<boolean>:
const confirmed = await env.dialog.confirm('Are you sure?')
if (confirmed) deleteItem()`

const toastExample = `// env.toast is injected by StandardOverlays.
// Convenience methods for each variant:

env.toast.success('Saved successfully!')
env.toast.error('Something went wrong')
env.toast.warn('Disk space low')
env.toast.info('New update available')

// Full options:
env.toast({
  message: 'Custom toast',
  variant: 'primary',
  duration: 5000,  // ms, default 3000. 0 = no auto-dismiss
})`

const drawerExample = `// env.drawer is injected by StandardOverlays.
// Drawer.show() returns a Promise that resolves when closed.

env.drawer({
  title: 'Settings',
  children: <SettingsPanel />,
  side: 'right',   // 'left' (default) | 'right'
  footer: <Button onClick={() => close()}>Done</Button>,
})

// Minimal — just content:
env.drawer({ children: <nav>Sidebar</nav> })`

const overlaySpec = `// Under the hood, all overlays use the same OverlaySpec:
interface OverlaySpec {
  mode: string              // 'modal' | 'toast' | 'drawer-left' | 'drawer-right'
  render: (close) => JSX    // renders the overlay content
  dismissible?: boolean     // backdrop click / Escape
  autoFocus?: boolean       // focus first focusable element
  aria?: { label?, labelledby?, describedby? }
}

// Dialog.show(), Toast.show(), Drawer.show() each return
// an OverlaySpec. The WithOverlays host pushes it onto
// a reactive stack and manages transitions + focus trap.`

export default function OverlaysPage() {
	return (
		<article>
			<h1>Overlays</h1>
			<p>
				Dialog, Toast, and Drawer — all using a shared overlay system injected via env by{' '}
				<code>StandardOverlays</code>.
			</p>

			<Section title="Setup">
				<p>
					<code>StandardOverlays</code> is a wrapper component that binds
					<code>env.dialog</code>, <code>env.toast</code>, and <code>env.drawer</code>.
				</p>
				<Code code={setup} lang="tsx" />
			</Section>

			<Section title="Dialog">
				<p>
					Imperative modal dialog. <code>env.dialog()</code> returns a <code>Promise</code> that
					resolves with the clicked button key (or <code>null</code> on dismiss).
				</p>
				<Code code={dialogExample} lang="tsx" />
			</Section>

			<Section title="Toast">
				<p>
					Notification toasts with auto-dismiss. Variant helpers:
					<code>success</code>, <code>error</code>, <code>warn</code>, <code>info</code>.
				</p>
				<Code code={toastExample} lang="tsx" />
			</Section>

			<Section title="Drawer">
				<p>
					Slide-out panel from left or right edge. Uses <code>side</code> prop (not{' '}
					<code>position</code>).
				</p>
				<Code code={drawerExample} lang="tsx" />
			</Section>

			<Section title="OverlaySpec">
				<p>
					All overlay types share a common <code>OverlaySpec</code> interface. You can push custom
					overlays via <code>env.overlay(spec)</code>.
				</p>
				<Code code={overlaySpec} lang="tsx" />
			</Section>

			<Section title="API Reference">
				<h4>DialogOptions</h4>
				<ApiTable
					props={[
						{
							name: 'title',
							type: 'JSX.Children',
							description: 'Dialog header title',
							required: false,
						},
						{
							name: 'message',
							type: 'JSX.Children',
							description: 'Dialog body content. Strings are wrapped in <p>',
							required: false,
						},
						{
							name: 'size',
							type: "'sm' | 'md' | 'lg'",
							description: 'Dialog width preset',
							required: false,
						},
						{
							name: 'buttons',
							type: 'Record<string, string | DialogButton>',
							description: 'Footer buttons. Key is the resolve value. Omit for a default OK button',
							required: false,
						},
						{
							name: 'dismissible',
							type: 'boolean',
							description: 'Allow backdrop click / Escape to close. Default: true',
							required: false,
						},
						{
							name: 'variant',
							type: 'string',
							description: 'Visual variant applied to the dialog container',
							required: false,
						},
					]}
				/>
				<h4>DialogButton</h4>
				<ApiTable
					props={[
						{ name: 'text', type: 'string', description: 'Button label', required: true },
						{
							name: 'variant',
							type: 'string',
							description: "Button variant. Default: 'secondary'",
							required: false,
						},
						{
							name: 'disabled',
							type: 'boolean',
							description: 'Disable the button',
							required: false,
						},
						{
							name: 'onClick',
							type: '() => any',
							description: 'Side-effect callback before closing',
							required: false,
						},
					]}
				/>
				<h4>ToastOptions</h4>
				<ApiTable
					props={[
						{ name: 'message', type: 'JSX.Children', description: 'Toast content', required: true },
						{
							name: 'variant',
							type: "'success' | 'danger' | 'warning' | 'primary' | 'secondary'",
							description: 'Color variant',
							required: false,
						},
						{
							name: 'duration',
							type: 'number',
							description: 'Auto-dismiss delay in ms. Default: 3000. Set 0 to disable',
							required: false,
						},
					]}
				/>
				<h4>DrawerOptions</h4>
				<ApiTable
					props={[
						{
							name: 'children',
							type: 'JSX.Children',
							description: 'Drawer body content',
							required: true,
						},
						{
							name: 'title',
							type: 'JSX.Children',
							description: 'Drawer header title',
							required: false,
						},
						{
							name: 'footer',
							type: 'JSX.Children',
							description: 'Drawer footer content',
							required: false,
						},
						{
							name: 'side',
							type: "'left' | 'right'",
							description: "Slide-in direction. Default: 'left'",
							required: false,
						},
						{
							name: 'dismissible',
							type: 'boolean',
							description: 'Allow backdrop click / Escape to close. Default: true',
							required: false,
						},
					]}
				/>
				<h4>OverlaySpec</h4>
				<ApiTable
					props={[
						{
							name: 'mode',
							type: 'string',
							description: "Stacking mode: 'modal', 'toast', 'drawer-left', 'drawer-right'",
							required: true,
						},
						{
							name: 'render',
							type: '(close: (value) => void) => JSX.Children',
							description: 'Render function for the overlay content',
							required: true,
						},
						{
							name: 'dismissible',
							type: 'boolean',
							description: 'Allow backdrop click / Escape to close',
							required: false,
						},
						{
							name: 'autoFocus',
							type: 'boolean | string',
							description: 'Auto-focus behavior. true = first focusable, string = CSS selector',
							required: false,
						},
						{
							name: 'id',
							type: 'string',
							description: 'Unique ID for tracking. Auto-generated if omitted',
							required: false,
						},
						{
							name: 'aria',
							type: '{ label?, labelledby?, describedby? }',
							description: 'Accessibility labels',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}

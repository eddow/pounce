import { client, buildRoute, type ClientRouteDefinition, type RouterModelRouteDefinition } from '@pounce/kit'
import { DockviewRouter } from '@pounce/ui'
import { reactive } from 'mutts'

type DemoRoute = ClientRouteDefinition

function overviewUrl() {
	return '/dockview-router'
}

function counterUrl(id: number) {
	return buildRoute('/dockview-router/counter/[id:integer]', { id: String(id) })
}

function notesUrl(id: number) {
	return buildRoute('/dockview-router/notes/[id:integer]', { id: String(id) })
}

const OverviewPanel = () => {
	return (
		<div data-test="dockview-router-overview" style="height: 100%; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #0f172a; color: white; box-sizing: border-box;">
			<h3 style="margin: 0;">DockviewRouter overview</h3>
			<p style="margin: 0; color: #cbd5e1; max-width: 54ch;">
				Use the controls around this dockview to navigate between routes. Each pushed route opens a tab,
				and activating a different tab should replace the current URL.
			</p>
			<div style="display: grid; gap: 8px; color: #94a3b8; font-size: 14px;">
				<div>1. Click the route buttons to open tabs from navigation.</div>
				<div>2. Click another tab header to verify the browser URL updates.</div>
				<div>3. Open the same route twice to verify push navigation creates a new tab.</div>
				<div>4. Use the browser back and forward buttons to watch dockview follow the URL.</div>
			</div>
		</div>
	)
}

const CounterPanel = (props: { id: string }) => {
	const state = reactive({ count: Number(props.id) || 0 })
	return (
		<div data-test={`dockview-router-counter-${props.id}`} style="height: 100%; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #111827; color: white; box-sizing: border-box;">
			<h3 style="margin: 0;">Counter route {props.id}</h3>
			<div style="font-size: 32px; font-weight: 700;">{state.count}</div>
			<div style="display: flex; gap: 8px; flex-wrap: wrap;">
				<button
					data-test={`dockview-router-counter-inc-${props.id}`}
					onClick={() => {
						state.count += 1
					}}
				>
					Increment
				</button>
				<button
					data-test={`dockview-router-counter-open-notes-${props.id}`}
					onClick={() => {
						client.navigate(notesUrl(Number(props.id) || 1))
					}}
				>
					Open sibling notes
				</button>
			</div>
			<p style="margin: 0; color: #94a3b8;">
				This panel is route-backed. Switching tabs should replace the current URL with this route.
			</p>
		</div>
	)
}

const NotesPanel = (props: { id: string }) => {
	const state = reactive({ text: `Notes for route ${props.id}` })
	return (
		<div data-test={`dockview-router-notes-${props.id}`} style="height: 100%; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #172554; color: white; box-sizing: border-box;">
			<h3 style="margin: 0;">Notes route {props.id}</h3>
			<textarea
				data-test={`dockview-router-notes-input-${props.id}`}
				style="flex: 1; min-height: 180px; resize: vertical; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: white; padding: 12px;"
				value={state.text}
				onInput={(e: Event) => {
					if (e.target instanceof HTMLTextAreaElement) state.text = e.target.value
				}}
			></textarea>
			<div style="color: #cbd5e1; font-size: 14px;">Characters: {state.text.length}</div>
		</div>
	)
}

const routerRoutes: readonly RouterModelRouteDefinition<DemoRoute>[] = [
	{
		path: '/dockview-router',
		title: 'Overview',
		view: () => <OverviewPanel />,
	},
	{
		path: '/dockview-router/counter/[id:integer]',
		title: (params) => `Counter ${params.id}`,
		view: (match) => <CounterPanel id={match.params.id} />,
	},
	{
		path: '/dockview-router/notes/[id:integer]',
		title: (params) => `Notes ${params.id}`,
		view: (match) => <NotesPanel id={match.params.id} />,
	},
]

const dockviewRouterEl = { style: 'height: 100%; width: 100%;' }
const dockviewRouterOptions = { singleTabMode: 'default' } as const

export default function DockviewRouterDemo() {
	const openCounter = (id: number) => client.navigate(counterUrl(id))
	const openNotes = (id: number) => client.navigate(notesUrl(id))
	return (
		<div data-test="dockview-router-demo" style="display: flex; flex-direction: column; gap: 16px; height: calc(100vh - 40px); max-height: 600px; padding: 20px; background: #0f172a; color: white; box-sizing: border-box;">
			<div style="display: flex; gap: 8px;">
				<button onClick={() => openCounter(1)}>Open Counter 1</button>
				<button onClick={() => openNotes(1)}>Open Notes 1</button>
				<button onClick={() => openCounter(2)}>Open Counter 2</button>
			</div>
			<div
				class="dockview-theme-dark"
				style="flex: 1; border: 1px solid #334155; border-radius: 12px; overflow: hidden; background: #020617;"
			>
				<DockviewRouter
					debug="DockviewRouterDemo"
					el={dockviewRouterEl}
					routes={routerRoutes}
					options={dockviewRouterOptions}
				/>
			</div>
		</div>
	)
}

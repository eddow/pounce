import { themeAbyss, themeLight, type DockviewApi, type DockviewGroupPanel, type SerializedDockview } from 'dockview-core'
import { effect, reactive } from 'mutts'
import { dialog } from '../components/dialog'
import { Dockview, DockviewWidget, DockviewWidgetScope, type DockviewWidgetProps } from '../components/dockview'
import { toast } from '../components/toast'

type DemoProps = DockviewWidgetProps<{
	clicks: number
}>

const testWidget1 = (props: DemoProps) => (
	<div style="padding: 1rem;">
		<h3>Test Panel 1</h3>
		<p>
			Size: {props.size?.width ?? 0} x {props.size?.height ?? 0}
		</p>
		<p>
			Clicks:{' '}
			<span
				use={(el: HTMLElement) =>
					effect(() => {
						el.innerText = String(props.params.clicks ?? 0)
					})
				}
			></span>
		</p>
		<div role="group">
			<button onClick={() => toast.info('Button 1 clicked!')}>Test Button 1</button>
			<button class="success" onClick={() => toast.success('Success from panel 1')}>
				Success Toast
			</button>
			<button
				class="warning"
				onClick={async () => {
					const res = await dialog('This is a dialog from panel 1')
					console.log('Dialog result:', res)
				}}
			>
				Open Dialog
			</button>
		</div>
	</div>
)

// Tab widget for default tabComponent 'normal' that shares scope with panel widget
const normalTabWidget = (
	props: DemoProps
) => {
	// Use shared context for state
	if (props.params.clicks === undefined) {
		props.params.clicks = 0
	}
	return (
		<div style="display: flex; gap: .25rem; align-items: center; justify-content: center; height: 100%;">
			<span style="margin-right: .25rem;">{props.title}</span>
			<button aria-label="Tab +1" onClick={() => props.params.clicks++}>
				+1
			</button>
		</div>
	)
}

const titleParamsWidget = (
	props: DockviewWidgetProps,
	{ panelApi }: DockviewWidgetScope
) => {
	return (
		<div style="padding: 1rem;">
			<h3>Title/Params Sync Test</h3>
			<div>
				<span>
					Title (from props): <span data-testid="title-display">{props.title}</span>
				</span>
			</div>
			<div>
				<span>
					Params (from props): <span data-testid="params-display">{JSON.stringify(props.params)}</span>
				</span>
			</div>
			<div
				role="group"
				style="display: flex; gap: 0.5rem; flex-direction: column; margin-top: 1rem;"
			>
				<button
					data-testid="update-title-prop"
					onClick={() => {
						// Update title via props (tests forward sync)
						const nextTitle = `Updated Title ${Date.now()}`
						props.title = nextTitle
					}}
				>
					Update Title via Props
				</button>
				<button
					data-testid="update-title-api"
					onClick={() => {
						// Update title via API (tests reverse sync)
						const nextTitle = `API Title ${Date.now()}`
						panelApi!.setTitle(nextTitle)
					}}
				>
					Update Title via API
				</button>
				<button
					data-testid="update-params-prop"
					onClick={() => {
						// Update params via props (tests forward sync)
						const nextParams = { test: Date.now(), from: 'prop' }
						Object.assign(props.params, nextParams)
					}}
				>
					Update Params via Props
				</button>
				<button
					data-testid="update-params-api"
					onClick={() => {
						// Update params via API (tests reverse sync)
						const nextParams = { test: Date.now(), from: 'api', initial: undefined }
						panelApi!.updateParameters(nextParams)
					}}
				>
					Update Params via API
				</button>
			</div>
		</div>
	)
}

const testWidget2: DockviewWidget = (props, { dockviewApi }) => (
	<div style="padding: 1rem;">
		<h3>Test Panel 2</h3>
		<p>
			Size: {props.size?.width ?? 0} x {props.size?.height ?? 0}
		</p>
		<div role="group">
			<button onClick={() => toast.warning('Button 2 clicked!')}>Test Button 2</button>
			<button class="danger" onClick={() => toast.danger('Error from panel 2')}>
				Error Toast
			</button>
			<button
				class="secondary"
				onClick={() => {
					if (dockviewApi)
						dockviewApi.addPanel({
							id: `panel-${Date.now()}`,
							component: 'test1',
							tabComponent: 'normal',
							title: `New Panel ${Date.now()}`,
						})
				}}
			>
				Add Panel
			</button>
		</div>
	</div>
)

const testWidget3: DockviewWidget = (props, { dockviewApi, panelApi }) => (
	<div style="padding: 1rem;">
		<h3>Test Panel 3</h3>
		<p>
			Size: {props.size?.width ?? 0} x {props.size?.height ?? 0}
		</p>
		<div role="group">
			<button onClick={() => toast('Info from panel 3')}>Info Toast</button>
			<button
				class="contrast"
				onClick={() => {
					dockviewApi!.addGroup()
				}}
			>
				Add Group
			</button>
			<button
				onClick={() => {
					panelApi!.updateParameters({ test: Date.now() })
				}}
			>
				Update Params
			</button>
		</div>
	</div>
)

const widgets = {
	test1: testWidget1,
	test2: testWidget2,
	test3: testWidget3,
	titleParams: titleParamsWidget,
}
const tabs = {
	normal: normalTabWidget,
}

// Demo header action component - shows panel count in group (reactive)
const groupHeaderAction = ({
	group,
}: {
	group: DockviewGroupPanel
}) => {
	group.onDidChange((x) => {
		console.log('group changed', x)
	})
	return (
		<div style="display: flex; align-items: center; gap: .25rem; padding: 0 .25rem;">
			<span style="font-size: 0.75rem; color: var(--pico-muted-color);">
				{group.panels.length} panel{group.panels.length !== 1 ? 's' : ''}
			</span>
		</div>
	)
}
export default (_: unknown, scope: Record<string, unknown>) => {

	let panelIdCounter = 0
	const state = reactive({
		layout: undefined as SerializedDockview | undefined,
		savedLayout: '',
		api: undefined! as DockviewApi
	})
	const getNextPanelId = () => `panel-${++panelIdCounter}`

	return (
		<section>
			<h1>Dockview</h1>
			<div if={state.api} role="group" style="margin-bottom: 1rem;">
				<button
					class="secondary"
					onClick={() => {
						state.savedLayout = JSON.stringify(state.layout)
						toast.info(`Layout saved (${(state.savedLayout ?? '').length} bytes)`)
					}}
				>
					Save Layout
				</button>
				<button
					class="secondary"
					disabled={!state.savedLayout}
					onClick={() => {
						state.layout = JSON.parse(state.savedLayout)
						toast.info(`Layout loaded (${(state.savedLayout ?? '').length} bytes)`)
					}}
				>
					Load Layout
				</button>
				<button
					disabled={!state.api}
					onClick={() => {
						state.api.addPanel({
							id: getNextPanelId(),
							component: 'test1',
							tabComponent: 'normal',
							title: 'Test Panel 1',
						})
					}}
				>
					Add Panel 1
				</button>
				<button
					disabled={!state.api}
					data-testid="add-title-params-panel"
					onClick={() => {
						state.api.addPanel({
							id: getNextPanelId(),
							component: 'titleParams',
							title: 'Initial Title',
							params: { initial: true },
						})
					}}
				>
					Add Title/Params Panel
				</button>
				<button
					class="secondary"
					disabled={!state.api}
					onClick={() => {
						state.api.addPanel({
							id: getNextPanelId(),
							component: 'test2',
							tabComponent: 'normal',
							title: 'Test Panel 2',
						})
					}}
				>
					Add Panel 2
				</button>
				<button
					class="contrast"
					disabled={!state.api}
					onClick={() => {
						state.api.addPanel({
							id: getNextPanelId(),
							component: 'test3',
							tabComponent: 'normal',
							title: 'Test Panel 3',
						})
					}}
				>
					Add Panel 3
				</button>
				<button
					class="success"
					disabled={!state.api}
					onClick={() => {
						state.api.addGroup()
					}}
				>
					Add Group
				</button>
				<button
					class="warning"
					disabled={!state.api}
					onClick={() => {
						const panel = state.api.activePanel
						if (panel) {
							toast.info(`Active panel: ${panel.id}`)
						} else {
							toast.warning('No active panel')
						}
					}}
				>
					Get Active Panel
				</button>
				<button
					class="danger"
					disabled={!state.api}
					onClick={() => {
						const panels = state.api.panels
						if (panels.length > 0) {
							panels[panels.length - 1].api.close()
						}
					}}
				>
					Close Last Panel
				</button>
				<button
					class="warning"
					disabled={!state.api}
					onClick={() => {
						state.layout = undefined
						toast.info('Layout cleared')
					}}
				>
					Clear Layout
				</button>
			</div>
			<Dockview
				el:style="height: 600px; border: 1px solid var(--pico-muted-border-color);"
				widgets={widgets}
				tabs={tabs}
				headerRight={groupHeaderAction}
				api={state.api}
				layout={state.layout}
				options:theme={scope.theme === 'dark' ? themeAbyss : themeLight}
			/>
		</section>
	)
}

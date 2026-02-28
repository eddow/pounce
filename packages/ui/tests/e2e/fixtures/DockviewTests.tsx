import { reactive } from 'mutts'
import { Dockview, DockviewWidgetProps } from '@pounce/ui'
import { DockviewApi } from 'dockview-core'

function SimpleWidget(props: DockviewWidgetProps<{ text: string }>) {
	return (
		<div class="test-widget">
			<h2 data-testid="widget-title">{props.title}</h2>
			<p data-testid="widget-content">{props.params.text}</p>
		</div>
	)
}

export default function DockviewTests() {
	const state = reactive({
		api: undefined as DockviewApi | undefined,
		layout: undefined as any
	})

	const ensureInit = () => {
		if (!state.api) return
		state.api.addPanel({
			id: 'panel-1',
			component: 'simple',
			title: 'Test Panel 1',
			params: { text: 'Hello Dockview' }
		})
	}

	return (
		<div style="height: 400px; display: flex; flex-direction: column;">
			<h1>Dockview Tests</h1>
			<div style="margin-bottom: 1rem">
				<button data-action="init-panels" onClick={ensureInit}>Init Panels</button>
				<button
					data-action="update-title"
					onClick={() => {
						const panel = state.api?.getPanel('panel-1')
						if (panel) panel.api.setTitle('Updated Title')
					}}
				>
					Update Title
				</button>
			</div>
			<div style="flex: 1; border: 1px solid #ccc;">
				<Dockview
					el={{ style: 'height: 100%; width: 100%; min-height: 200px;' }}
					api={state.api}
					layout={state.layout}
					widgets={{ simple: SimpleWidget }}
					options={{ className: 'dockview-theme-light' }}
				/>
			</div>
		</div>
	)
}

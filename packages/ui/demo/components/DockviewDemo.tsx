import { Dockview, type DockviewHeaderAction, type DockviewWidget } from '@sursaut/ui/dockview'
import { Orientation, type DockviewApi, type SerializedDockview } from 'dockview-core'
import { effect, reactive, untracked } from 'mutts'

type DemoContext = {
	accent?: string
	badge?: string
	label?: string
	status?: string
}

type CounterParams = {
	panelId: string
	initial: number
	step: number
}

type NotesParams = {
	panelId: string
	initial: string
}

function cloneLayout(layout: SerializedDockview): SerializedDockview {
	return JSON.parse(JSON.stringify(layout)) as SerializedDockview
}

function createDefaultLayout(): SerializedDockview {
	return {
		grid: {
			root: {
				type: 'branch',
				data: [
					{
						type: 'leaf',
						data: {
							id: 'demo-group',
							views: ['counter-1', 'notes-1'],
							activeView: 'counter-1',
						},
						size: 900,
					},
				],
			},
			width: 900,
			height: 520,
			orientation: Orientation.HORIZONTAL,
		},
		panels: {
			'counter-1': {
				id: 'counter-1',
				contentComponent: 'counter',
				tabComponent: 'live-counter-tab',
				title: 'Counter 1',
				params: {
					panelId: 'counter-1',
					initial: 1,
					step: 1,
				},
			},
			'notes-1': {
				id: 'notes-1',
				contentComponent: 'notes',
				tabComponent: 'live-notes-tab',
				title: 'Notes',
				params: {
					panelId: 'notes-1',
					initial: 'Hello from Dockview',
				},
			},
		},
	}
}

const CounterWidget: DockviewWidget<CounterParams, DemoContext> = (props) => {
	const state = reactive({ value: untracked`DockviewDemo.CounterWidget.initial`(() => props.params.initial) })

	effect`DockviewDemo.CounterWidget.syncContext`(() => {
		props.context.badge = String(state.value)
		props.context.status = state.value % 2 === 0 ? 'even' : 'odd'
		props.context.accent = state.value % 2 === 0 ? '#0f766e' : '#7c3aed'
	})

	return (
		<div
			data-test={`dockview-counter-${props.params.panelId}`}
			style="height: 100%; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #0f172a; color: white; box-sizing: border-box;"
		>
			<h3 style="margin: 0;">Counter widget</h3>
			<div data-test={`dockview-counter-value-${props.params.panelId}`} style="font-size: 28px; font-weight: 700;">
				{state.value}
			</div>
			<div style="display: flex; gap: 8px; flex-wrap: wrap;">
				<button
					data-test={`dockview-counter-inc-${props.params.panelId}`}
					style="background: #2563eb; color: white; border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer;"
					onClick={() => {
						state.value += props.params.step
					}}
				>
					+{props.params.step}
				</button>
				<button
					data-test={`dockview-counter-rename-${props.params.panelId}`}
					style="background: #334155; color: white; border: 1px solid #475569; border-radius: 8px; padding: 8px 12px; cursor: pointer;"
					onClick={() => {
						const label = `Counter ${state.value}`
						props.context.label = label
						props.title = label
					}}
				>
					Rename tab
				</button>
			</div>
			<div style="color: #94a3b8; font-size: 14px;">
				Shared context badge: <strong>{props.context.badge ?? '-'}</strong>
			</div>
		</div>
	)
}

const NotesWidget: DockviewWidget<NotesParams, DemoContext> = (props) => {
	const state = reactive({ text: untracked`DockviewDemo.NotesWidget.initial`(() => props.params.initial) })

	effect`DockviewDemo.NotesWidget.syncContext`(() => {
		props.context.badge = String(state.text.length)
		props.context.status = state.text.length === 0 ? 'empty' : 'draft'
		props.context.accent = state.text.length === 0 ? '#64748b' : '#ea580c'
	})

	return (
		<div
			data-test={`dockview-notes-${props.params.panelId}`}
			style="height: 100%; padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #111827; color: white; box-sizing: border-box;"
		>
			<h3 style="margin: 0;">Notes widget</h3>
			<textarea
				data-test={`dockview-notes-input-${props.params.panelId}`}
				style="flex: 1; min-height: 160px; resize: vertical; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: white; padding: 12px;"
				value={state.text}
				onInput={(e: Event) => {
					if (e.target instanceof HTMLTextAreaElement) state.text = e.target.value
				}}
			></textarea>
			<div style="color: #94a3b8; font-size: 14px;">
				Characters shared to tab: <strong>{props.context.badge ?? '0'}</strong>
			</div>
		</div>
	)
}

const LiveTab: DockviewWidget<{ panelId: string }, DemoContext> = (props, scope) => {
	const accent = () => props.context.accent ?? '#475569'
	const label = () => props.context.label ?? props.title
	return (
		<div
			data-test={`dockview-tab-${props.params.panelId}`}
			class="tab"
			style="display: flex; align-items: center; gap: 6px; width: 100%; min-width: 0;"
		>
			<span
				data-test={`dockview-tab-dot-${props.params.panelId}`}
				style={`width: 8px; height: 8px; border-radius: 999px; flex: 0 0 auto; background: ${accent()};`}
			></span>
			<span
				data-test={`dockview-tab-title-${props.params.panelId}`}
				class="title"
				title={label()}
			>
				{label()}
			</span>
			<span
				data-test={`dockview-tab-badge-${props.params.panelId}`}
				style={`font-size: 11px; line-height: 1; padding: 3px 6px; border-radius: 999px; background: ${accent()}; color: white; flex: 0 0 auto;`}
			>
				{props.context.badge ?? '0'}
			</span>
			<button
				data-test={`dockview-tab-close-${props.params.panelId}`}
				class="close"
				aria-label={`Close ${props.title}`}
				onClick={() => scope.panelApi?.close()}
			>
				×
			</button>
		</div>
	)
}

const GroupHeaderAction: DockviewHeaderAction = ({ group }) => {
	return (
		<button
			data-test={`dockview-group-close-${group.id}`}
			style="background: transparent; color: inherit; border: 1px solid currentColor; border-radius: 999px; padding: 2px 8px; font-size: 11px; cursor: pointer; opacity: 0.8;"
			onClick={() => group.api.close()}
		>
			Close group ({group.panels.length})
		</button>
	)
}

export default function DockviewDemo() {
	const initialLayout = createDefaultLayout()
	const state = reactive<{
		api: DockviewApi | undefined
		layout: SerializedDockview | undefined
		mounted: boolean
		panelCount: number
		activePanelId: string | undefined
		savedLayout: string
	}>({
		api: undefined,
		layout: cloneLayout(initialLayout),
		mounted: true,
		panelCount: 0,
		activePanelId: undefined,
		savedLayout: '',
	})
	let nextCounter = 2
	let nextNotes = 2

	effect`DockviewDemo.syncApiState`(() => {
		const api = state.api
		if (!api) {
			state.panelCount = 0
			state.activePanelId = undefined
			return
		}
		const syncRuntime = () => {
			state.panelCount = api.totalPanels
			state.activePanelId = api.activePanel?.id ?? api.panels[0]?.id
		}
		const ensureActive = () => {
			if (!api.activePanel && api.panels[0]) api.panels[0].api.setActive()
			syncRuntime()
		}
		syncRuntime()
		const onAdd = api.onDidAddPanel(syncRuntime)
		const onRemove = api.onDidRemovePanel(syncRuntime)
		const onActive = api.onDidActivePanelChange(syncRuntime)
		const onLayout = api.onDidLayoutChange(syncRuntime)
		const onLayoutFromJson = api.onDidLayoutFromJSON(ensureActive)
		ensureActive()
		return () => {
			onAdd.dispose()
			onRemove.dispose()
			onActive.dispose()
			onLayout.dispose()
			onLayoutFromJson.dispose()
		}
	})

	const widgets = {
		counter: CounterWidget,
		notes: NotesWidget,
	}
	const tabs = {
		'live-counter-tab': LiveTab,
		'live-notes-tab': LiveTab,
	}

	const addCounter = () => {
		const api = state.api
		if (!api) return
		const id = `counter-${nextCounter++}`
		const order = Number(id.split('-')[1])
		const referencePanel = api.activePanel ?? api.panels[0]
		api.addPanel({
			id,
			title: `Counter ${id.split('-')[1]}`,
			component: 'counter',
			tabComponent: 'live-counter-tab',
			params: { panelId: id, initial: order, step: 1 },
			floating: false,
			...(referencePanel
				? { position: { referencePanel, direction: 'within' as const } }
				: { position: { direction: 'right' as const } }),
		})
	}

	const addNotes = () => {
		const api = state.api
		if (!api) return
		const id = `notes-${nextNotes++}`
		const referencePanel = api.activePanel ?? api.panels[0]
		api.addPanel({
			id,
			title: `Notes ${id.split('-')[1]}`,
			component: 'notes',
			tabComponent: 'live-notes-tab',
			params: { panelId: id, initial: `Notes for ${id}` },
			floating: false,
			...(referencePanel
				? { position: { referencePanel, direction: 'within' as const } }
				: { position: { direction: 'right' as const } }),
		})
	}

	const splitActiveRight = () => {
		const api = state.api
		const referencePanel = api?.activePanel ?? api?.panels[0]
		if (!api || !referencePanel) return
		const id = `counter-${nextCounter++}`
		const order = Number(id.split('-')[1])
		api.addPanel({
			id,
			title: `Counter ${id.split('-')[1]}`,
			component: 'counter',
			tabComponent: 'live-counter-tab',
			params: { panelId: id, initial: order, step: 1 },
			floating: false,
			position: { referencePanel, direction: 'right' as const },
		})
	}

	const saveLayout = () => {
		state.savedLayout = JSON.stringify(state.api?.toJSON() ?? state.layout ?? createDefaultLayout(), null, 2)
	}

	const restoreLayout = () => {
		if (!state.savedLayout) return
		const nextLayout = JSON.parse(state.savedLayout) as SerializedDockview
		const snapshot = cloneLayout(nextLayout)
		state.layout = snapshot
		state.mounted = false
		state.api = undefined
		requestAnimationFrame(() => {
			state.mounted = true
		})
	}

	const resetLayout = () => {
		const nextLayout = createDefaultLayout()
		const snapshot = cloneLayout(nextLayout)
		state.layout = snapshot
		state.mounted = false
		state.api = undefined
		requestAnimationFrame(() => {
			state.mounted = true
		})
	}

	const closeActive = () => {
		const api = state.api
		const panel = api?.activePanel ?? api?.panels[0]
		panel?.api.close()
	}

	return (
		<div data-test="dockview-demo" style="padding: 20px; background: #0f172a; border-radius: 8px; color: white;">
			<h2>Dockview Primitive Demo</h2>
			<p style="color: #94a3b8; max-width: 72ch;">
				This demo exercises dynamic panels, layout persistence, group header actions, and custom tabs that react to shared widget context.
			</p>
			<div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0;">
				<button data-test="dockview-add-counter" onClick={addCounter}>Add Counter</button>
				<button data-test="dockview-add-notes" onClick={addNotes}>Add Notes</button>
				<button data-test="dockview-split-active-right" onClick={splitActiveRight}>Split Active Right</button>
				<button data-test="dockview-save-layout" onClick={saveLayout}>Save Layout</button>
				<button data-test="dockview-restore-layout" onClick={restoreLayout} disabled={!state.savedLayout}>Restore Saved</button>
				<button data-test="dockview-reset-layout" onClick={resetLayout}>Reset Layout</button>
				<button
					data-test="dockview-close-active"
					onClick={closeActive}
					disabled={!state.activePanelId}
				>
					Close Active
				</button>
			</div>
			<div style="display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 16px; align-items: start;">
				<div
					data-test="dockview-shell"
					class="dockview-theme-dark"
					style="height: 480px; border: 1px solid #334155; border-radius: 12px; overflow: hidden; background: #020617;"
				>
					{state.mounted && (
						<Dockview
							api={state.api}
							widgets={widgets}
							tabs={tabs}
							headerRight={GroupHeaderAction}
							layout={state.layout}
							options={{ singleTabMode: 'default' }}
							el={{ style: 'height: 100%; width: 100%;' }}
						/>
					)}
				</div>
				<div style="display: flex; flex-direction: column; gap: 12px;">
					<div style="padding: 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b;">
						<div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px;">Runtime</div>
						<div data-test="dockview-api-state">API: {state.api ? 'ready' : 'pending'}</div>
						<div data-test="dockview-panel-count">Panels: {state.panelCount}</div>
						<div data-test="dockview-active-panel">Active: {state.activePanelId ?? 'none'}</div>
					</div>
					<div style="padding: 12px; border-radius: 8px; border: 1px solid #334155; background: #1e293b;">
						<div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px;">Saved Layout</div>
						<pre
							data-test="dockview-saved-layout"
							style="margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 12px; color: #cbd5e1; max-height: 220px; overflow: auto;"
						>
							{state.savedLayout || 'Nothing saved yet.'}
						</pre>
					</div>
				</div>
			</div>
		</div>
	)
}

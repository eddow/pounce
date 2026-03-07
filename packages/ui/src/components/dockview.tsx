import {
	createDockview,
	type DockviewApi,
	type DockviewGroupPanel,
	type DockviewOptions,
	type DockviewPanelApi,
	type GroupPanelPartInitParameters,
	type IContentRenderer,
	type SerializedDockview,
} from 'dockview-core'
import 'dockview-core/dist/styles/dockview.css'
import { extend, fromAttribute, latch, ReactiveProp } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { biDi, effect, reactive, root, type ScopedCallback, unreactive } from 'mutts'
import { Icon } from '../icon'

componentStyle.sass`
.pounce-dockview
	width: 100%
	height: 100%

.pounce-dv-item
	width: 100%
	height: 100%

	&.tab
		display: flex
		align-items: center
		overflow: hidden
		padding: 0 4px
		gap: 2px

		.title
			flex: 1
			overflow: hidden
			text-overflow: ellipsis
			white-space: nowrap
			margin: 0 4px

		.close
			margin-left: auto
			background: none
			border: none
			padding: 0
			display: flex
			align-items: center
			justify-content: center
			cursor: pointer
			color: inherit
			opacity: 0.7
			&:hover
				opacity: 1
`

export type DockviewWidgetProps<
	Params extends Record<string, any> = Record<string, any>,
	Context extends Record<PropertyKey, any> = Record<PropertyKey, any>,
> = {
	title: string
	size: { width: number; height: number }
	params: Params
	context: Context
}

export interface DockviewWidgetScope extends Record<PropertyKey, unknown> {
	dockviewApi?: DockviewApi
	panelApi?: DockviewPanelApi
}

export type DockviewWidget<
	Params extends Record<string, any> = Record<string, any>,
	Context extends Record<PropertyKey, any> = Record<PropertyKey, any>,
> = (props: DockviewWidgetProps<Params, Context>, scope: DockviewWidgetScope) => JSX.Element

export type DockviewHeaderActionProps = {
	group: DockviewGroupPanel
}

export type DockviewHeaderAction = (
	props: DockviewHeaderActionProps,
	scope: DockviewWidgetScope
) => JSX.Element | null

function logDockview(debug: boolean | string | undefined, event: string, payload?: unknown) {
	if (!debug) return
	const label = typeof debug === 'string' ? debug : 'Dockview'
	if (payload === undefined) {
		console.log(`[${label}] ${event}`)
		return
	}
	console.log(`[${label}] ${event}`, payload)
}

// #region Renderers

function contentRenderer(
	Widget: DockviewWidget,
	props: Partial<DockviewWidgetProps>,
	onDispose: ScopedCallback,
	scope: Record<string, any>
): IContentRenderer {
	const element = document.createElement('div')
	element.classList.add('pounce-dv-item', 'body')
	const size = reactive({ width: 0, height: 0 })
	const cleanups: ScopedCallback[] = [onDispose]

	return {
		element,
		init: ({ api: panelApi, params, title }: GroupPanelPartInitParameters) => {
			params = reactive(params)
			const internalState = reactive({ title })
			const context = props.context ?? reactive({})
			Object.defineProperties(props, {
				title: {
					get: () => internalState.title,
					set: (v: string) => {
						panelApi.setTitle(v)
						internalState.title = v
					},
					enumerable: true,
					configurable: true,
				},
			})
			Object.assign(props, {
				params,
				size,
				context,
			})
			cleanups.push(
				panelApi.onDidTitleChange(
					(e: any) => (internalState.title = typeof e === 'string' ? e : e.title)
				).dispose,
				effect(() => panelApi.updateParameters(params)),
				panelApi.onDidParametersChange((payload: any) => {
					Object.assign(params, payload)
				}).dispose,
				latch(
					element,
					<Widget
						title={(props as DockviewWidgetProps).title}
						params={(props as DockviewWidgetProps).params}
						size={(props as DockviewWidgetProps).size}
						context={(props as DockviewWidgetProps).context}
					/>,
					extend(scope, {
						dockviewApi: scope.dockviewApi ?? scope.api,
						panelApi: unreactive(panelApi),
					})
				)
			)
		},
		layout: (width: number, height: number) => {
			size.width = width
			size.height = height
		},
		dispose() {
			for (const cleanup of cleanups) cleanup()
		},
	}
}

function tabRenderer(
	Widget: DockviewWidget,
	props: DockviewWidgetProps,
	scope: Record<string, any>
): IContentRenderer {
	const element = document.createElement('div')
	element.classList.add('pounce-dv-item', 'tab')
	let cleanup: ScopedCallback | undefined

	return {
		element,
		init: ({ api: panelApi }: GroupPanelPartInitParameters) => {
			cleanup = latch(
				element,
				<Widget
					title={(props as DockviewWidgetProps).title}
					params={(props as DockviewWidgetProps).params}
					size={(props as DockviewWidgetProps).size}
					context={(props as DockviewWidgetProps).context}
				/>,
				extend(scope, {
					dockviewApi: scope.dockviewApi ?? scope.api,
					panelApi: unreactive(panelApi),
				})
			)
		},
		dispose() {
			cleanup?.()
		},
	}
}

function headerActionRenderer(
	Widget: DockviewHeaderAction,
	{ group }: DockviewHeaderActionProps,
	scope: Record<string, any>
) {
	const element = document.createElement('div')
	element.classList.add('pounce-dv-item')
	let cleanup: ScopedCallback | undefined
	return {
		element,
		init() {
			cleanup = latch(
				element,
				<Widget group={group} />,
				extend(scope, { dockviewApi: scope.dockviewApi ?? scope.api })
			)
		},
		dispose() {
			cleanup?.()
		},
	}
}

// #endregion

export interface RegularDockviewWidgetProps extends DockviewWidgetProps {
	closeable?: boolean
}

const DefaultTab = (props: RegularDockviewWidgetProps, { panelApi }: Record<string, any>) => {
	if (!('closeable' in props)) props.closeable = true
	return (
		<div class="tab">
			<span class="title" title={props.title}>
				{props.title}
			</span>
			{props.closeable && (
				<button class="close" aria-label="Close" onClick={() => panelApi.close()}>
					<Icon name="tabler-outline-x" />
				</button>
			)}
		</div>
	)
}

export const Dockview = (
	props: {
		api?: DockviewApi
		debug?: boolean | string
		onReady?: (api: DockviewApi) => void
		widgets: Record<string, DockviewWidget<any>>
		tabs?: Record<string, DockviewWidget<any>>
		headerLeft?: DockviewHeaderAction
		headerRight?: DockviewHeaderAction
		headerPrefix?: DockviewHeaderAction
		el?: JSX.GlobalHTMLAttributes
		options?: DockviewOptions
		layout?: SerializedDockview
	},
	scope: Record<string, any>
) => {
	const contexts = new Map<string, Record<PropertyKey, any>>()
	let dockviewApi: DockviewApi | undefined

	// Capture layout binding from the raw composite attributes (component body — runs once)
	const attributes = (props as any)[fromAttribute]
	const layoutBinding = attributes?.getSingle('layout')

	// Snapshot props in the component body (outside any attend effect)
	// so initDockview reads zero reactive properties.
	const debugLabel = props.debug
	const widgetMap = props.widgets
	const tabMap = props.tabs
	const onReadyCb = props.onReady
	const hasLayout =
		layoutBinding instanceof ReactiveProp
			? layoutBinding.get() !== undefined
			: props.layout !== undefined

	const initDockview = (_target: Node | readonly Node[]) => {
		const element = (Array.isArray(_target) ? _target[0] : _target) as HTMLElement
		if (dockviewApi) return // already initialized
		logDockview(debugLabel, 'init:start', {
			hasLayout,
			widgetNames: Object.keys(widgetMap),
		})
		try {
			const activeApi = unreactive(
				createDockview(element, {
					createComponent({ id, name }: { id: string; name: string }) {
						logDockview(debugLabel, 'createComponent', {
							id,
							name,
							knownWidgets: Object.keys(widgetMap),
						})
						const widget = widgetMap[name]
						if (!widget) throw new Error(`Widget ${name} not found`)
						const context = reactive({})
						contexts.set(id, context)
						return contentRenderer(
							widget,
							context,
							() => {
								contexts.delete(id)
							},
							scope
						)
					},
					createTabComponent({ id, name }: { id: string; name: string }) {
						logDockview(debugLabel, 'createTabComponent', {
							id,
							name,
							knownTabs: Object.keys(tabMap ?? {}),
						})
						const widget = tabMap?.[name] ?? DefaultTab
						const context = contexts.get(id)
						if (!context) throw new Error(`Context ${id} not found`)
						return tabRenderer(widget, context as DockviewWidgetProps, scope)
					},
				})
			)
			dockviewApi = activeApi
		} catch (e) {
			console.error('[Dockview] createDockview CRASHED (sync):', e)
			return
		}
		const api = dockviewApi
		try {
			if (scope && typeof scope === 'object' && !Object.isFrozen(scope)) {
				scope.dockviewApi = api
				scope.api = api
				logDockview(debugLabel, 'init:scope-api-set')
			}
		} catch (_e) {}
		// Set up reactive bindings in root() — detached from the attend:use
		// effect chain so reactive prop reads don't tear down initDockview.
		const stopBindings = root((): (() => void) => {
			const cleanups: (() => void)[] = []
			const hasControlledLayout =
				layoutBinding instanceof ReactiveProp
					? layoutBinding.get() !== undefined
					: props.layout !== undefined
			const readLayout =
				layoutBinding instanceof ReactiveProp ? () => layoutBinding.get() : () => props.layout
			const writeLayout =
				layoutBinding instanceof ReactiveProp && layoutBinding.set
					? (value: SerializedDockview | undefined) => layoutBinding.set?.(value)
					: (value: SerializedDockview | undefined) => {
							props.layout = value
						}
			let applyingExternalLayout = false
			const receiveLayout = (layout: SerializedDockview | undefined) => {
				logDockview(debugLabel, 'layout:receive', {
					hasLayout: layout !== undefined,
					panelCount: api.panels.length,
				})
				applyingExternalLayout = true
				try {
					if (layout) api.fromJSON(layout)
					else {
						logDockview(debugLabel, 'layout:close-all-groups', {
							panelCount: api.panels.length,
						})
						api.closeAllGroups()
					}
				} finally {
					applyingExternalLayout = false
				}
			}
			if (!hasControlledLayout) {
				logDockview(debugLabel, 'layout:uncontrolled')
			} else if (layoutBinding instanceof ReactiveProp && layoutBinding.set) {
				const provideLayout = biDi(receiveLayout, {
					get: () => layoutBinding.get(),
					set: (value: SerializedDockview | undefined) => layoutBinding.set?.(value),
				})
				cleanups.push(
					api.onDidLayoutChange(() => {
						if (!applyingExternalLayout) {
							logDockview(debugLabel, 'layout:onDidLayoutChange:provide', {
								panelCount: api.panels.length,
							})
							provideLayout(api.toJSON())
						}
					}).dispose
				)
			} else {
				cleanups.push(
					effect(() => {
						const layout = readLayout()
						if (!applyingExternalLayout) receiveLayout(layout)
					})
				)
				cleanups.push(
					api.onDidLayoutChange(() => {
						if (!applyingExternalLayout) {
							logDockview(debugLabel, 'layout:onDidLayoutChange:write', {
								panelCount: api.panels.length,
							})
							writeLayout(api.toJSON())
						}
					}).dispose
				)
			}
			const emptyOptions: Record<string, any> = {}
			cleanups.push(
				effect(() => {
					api.updateOptions(props.options ? { ...emptyOptions, ...props.options } : emptyOptions)
					if (props.options) for (const k of Object.keys(props.options)) emptyOptions[k] = undefined
				})
			)
			cleanups.push(
				effect(function maintainHeaderActions() {
					const { headerLeft, headerRight, headerPrefix } = props
					api.updateOptions({
						createLeftHeaderActionComponent:
							headerLeft &&
							((group: DockviewGroupPanel) => {
								return headerActionRenderer(headerLeft, { group }, scope)
							}),
						createRightHeaderActionComponent:
							headerRight &&
							((group: DockviewGroupPanel) => {
								return headerActionRenderer(headerRight, { group }, scope)
							}),
						createPrefixHeaderActionComponent:
							headerPrefix &&
							((group: DockviewGroupPanel) => {
								return headerActionRenderer(headerPrefix, { group }, scope)
							}),
					})
				})
			)
			return () => {
				for (const c of cleanups) c()
			}
		})
		root(() => onReadyCb?.(api))
		return () => {
			logDockview(debugLabel, 'dispose', {
				panelCount: api.panels.length,
			})
			stopBindings?.()
			api.dispose()
			dockviewApi = undefined
		}
	}

	return (
		<div
			{...(props.el || {})}
			class="pounce-dockview"
			data-testid="dockview-theme-container"
			use={initDockview}
		></div>
	)
}

export const dockviewInternals = {
	contentRenderer,
	tabRenderer,
	headerActionRenderer,
}

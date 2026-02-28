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
import { extend, latch } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { biDi, effect, reactive, type ScopedCallback, unreactive } from 'mutts'
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

export interface DockviewWidgetScope extends Record<string, any> {
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
				context: {},
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
					<Widget {...(props as DockviewWidgetProps)} />,
					extend(scope, { panelApi: unreactive(panelApi) })
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
				<Widget {...(props as DockviewWidgetProps)} />,
				extend(scope, { panelApi: unreactive(panelApi) })
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
			cleanup = latch(element, <Widget group={group} />, scope)
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
	let initialized = false

	const initDockview = (element: HTMLElement) => {
		if (initialized) throw new Error('Dockview already initialized')
		initialized = true
		let instanceApi: DockviewApi | undefined
		try {
			const activeApi = unreactive(
				createDockview(element, {
					createComponent({ id, name }: { id: string; name: string }) {
						const widget = props.widgets[name]
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
						const widget = props.tabs?.[name] ?? DefaultTab
						const context = contexts.get(id)
						if (!context) throw new Error(`Context ${id} not found`)
						return tabRenderer(widget, context as DockviewWidgetProps, scope)
					},
				})
			)
			try {
				if (scope && typeof scope === 'object' && !Object.isFrozen(scope)) {
					scope.api = activeApi
				}
			} catch (_e) {
				// Fallback or ignore if scope is strictly read-only
			}
			props.api = instanceApi = activeApi
		} catch (e) {
			console.error('[Dockview] createDockview CRASHED (sync):', e)
			return
		}
		const provideLayout = biDi(
			(v) => {
				if (v) instanceApi!.fromJSON(v)
				else instanceApi!.closeAllGroups()
			},
			{
				get: () => props.layout,
				set: (v) => (props.layout = v),
			}
		)
		instanceApi.onDidLayoutChange(() => {
			provideLayout(instanceApi!.toJSON())
		})
		const emptyOptions: Record<string, any> = {}
		effect(() => {
			instanceApi!.updateOptions(
				props.options ? { ...emptyOptions, ...props.options } : emptyOptions
			)
			if (props.options) for (const k of Object.keys(props.options)) emptyOptions[k] = undefined
		})
		effect(function maintainHeaderActions() {
			const { headerLeft, headerRight, headerPrefix } = props
			instanceApi!.updateOptions({
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
		effect(() => () => instanceApi?.dispose())
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

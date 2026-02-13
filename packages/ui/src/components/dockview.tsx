import {
	createDockview,
	DockviewApi,
	DockviewGroupPanel,
	DockviewOptions,
	DockviewPanelApi,
	GroupPanelPartInitParameters,
	IContentRenderer,
	type SerializedDockview
} from 'dockview-core'
import 'dockview-core/dist/styles/dockview.css'
import { biDi, effect, reactive, type ScopedCallback, unreactive } from 'mutts'
import { bindApp, extend } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter'
import { Button } from './button'

componentStyle.sass`
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
`

export type DockviewWidgetProps<Params extends Record<string, any> = Record<string, any>, Context extends Record<PropertyKey, any> = Record<PropertyKey, any>> = {
	title: string
	size: { width: number; height: number }
	params: Params
	context: Context
}

export interface DockviewWidgetScope extends Record<string, any> {
	dockviewApi?: DockviewApi
	panelApi?: DockviewPanelApi
}

export type DockviewWidget<Params extends Record<string, any> = Record<string, any>, Context extends Record<PropertyKey, any> = Record<PropertyKey, any>> = (
	props: DockviewWidgetProps<Params, Context>,
	scope: DockviewWidgetScope
) => JSX.Element

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
		init: ({ api, params, title }: GroupPanelPartInitParameters) => {
			params = reactive(params)
			Object.assign(props, {
				title: {
					get: () => title,
					set: (v: string) => { api.setTitle(v); title = v },
				},
				params,
				size,
				context: {},
			})
			cleanups.push(
				api.onDidTitleChange((e: any) => title = typeof e === 'string' ? e : e.title).dispose,
				effect(() => api.updateParameters(params)),
				api.onDidParametersChange((payload: any) => {
					Object.assign(params, payload)
				}).dispose,
				bindApp(<Widget {...props as DockviewWidgetProps} />, element, extend(scope, { panelApi: unreactive(api) }))
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
		init: ({ api }: GroupPanelPartInitParameters) => {
			cleanup = bindApp(<Widget {...props as DockviewWidgetProps} />, element, extend(scope, { panelApi: unreactive(api) }))
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
			cleanup = bindApp(<Widget group={group} />, element, scope)
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

const DefaultTab = (
	props: RegularDockviewWidgetProps, { panelApi }: Record<string, any>
) => {
	if (!('closeable' in props)) props.closeable = true
	return (
		<div class="tab">
			<span
				class="title"
				title={props.title}
			>
				{props.title}
			</span>
			<Button if={props.closeable} el:class="close" icon="tabler-outline-x" onClick={() => panelApi.close()} />
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
	const adapter = getAdapter('Dockview')
	const contexts = new Map<string, Record<PropertyKey, any>>()
	let initialized = false

	const initDockview = (element: HTMLElement) => {
		if (initialized) throw new Error('Dockview already initialized')
		initialized = true
		let api: DockviewApi | undefined
		try {
			props.api = scope.api = api = unreactive(createDockview(element, {
				createComponent({ id, name }) {
					const widget = props.widgets[name]
					if (!widget) throw new Error(`Widget ${name} not found`)
					const context = reactive({})
					contexts.set(id, context)
					return contentRenderer(widget, context, () => {
						contexts.delete(id)
					}, scope)
				},
				createTabComponent({ id, name }) {
					const widget = props.tabs?.[name] ?? DefaultTab
					const context = contexts.get(id)
					if (!context) throw new Error(`Context ${id} not found`)
					return tabRenderer(widget, context as DockviewWidgetProps, scope)
				},
			}))
		} catch (e) {
			console.error('[Dockview] createDockview CRASHED (sync):', e)
			return
		}
		const provideLayout = biDi(
			(v) => {
				if (v) api.fromJSON(v)
				else api.closeAllGroups()
			},
			{
				get: () => props.layout,
				set: (v) => (props.layout = v),
			}
		)
		api.onDidLayoutChange(() => { provideLayout(api.toJSON()) })
		const emptyOptions: Record<string, any> = {}
		effect(() => {
			api.updateOptions(props.options ? { ...emptyOptions, ...props.options } : emptyOptions)
			if (props.options) for (const k of Object.keys(props.options))
				emptyOptions[k] = undefined
		})
		effect(function maintainHeaderActions() {
			const { headerLeft, headerRight, headerPrefix } = props
			api.updateOptions({
				createLeftHeaderActionComponent: headerLeft && ((group) => {
					return headerActionRenderer(
						headerLeft,
						{ group },
						scope
					)
				}),
				createRightHeaderActionComponent: headerRight && ((group) => {
					return headerActionRenderer(
						headerRight,
						{ group },
						scope
					)
				}),
				createPrefixHeaderActionComponent: headerPrefix && ((group) => {
					return headerActionRenderer(
						headerPrefix,
						{ group },
						scope
					)
				})
			})
		})
		effect(() => () => api?.dispose())
	}

	const baseClass = adapter.classes?.base || 'pounce-dockview'

	return (
		<div
			{...props.el}
			class={[baseClass, props.el?.class]}
			data-testid="dockview-theme-container"
			use={initDockview}
		></div>
	)
}

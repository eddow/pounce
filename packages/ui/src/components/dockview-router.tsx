import { defaults } from '@pounce/core'
import {
	type ClientRouteDefinition,
	client,
	type NavigationKind,
	type OpenedRoute,
	type RouterLoading,
	type RouterModel,
	type RouterModelConfig,
	type RouterModelRouteDefinition,
	type RouterNotFound,
	type RouterOnRouteEnd,
	type RouterOnRouteError,
	type RouterOnRouteStart,
	type RouteSpecification,
	routerModel,
} from '@pounce/kit'
import type { DockviewApi, DockviewOptions, SerializedDockview } from 'dockview-core'
import { effect } from 'mutts'
import { Dockview, type DockviewHeaderAction, type DockviewWidget } from './dockview'

export type DockviewRouteWidgetParams = Record<string, string> & {
	url: string
	routeId: string
}

export interface DockviewRouterProps<Definition extends ClientRouteDefinition> {
	readonly routes: readonly RouterModelRouteDefinition<Definition>[]
	readonly getRouteId?: RouterModelConfig<Definition>['getRouteId']
	readonly debug?: boolean | string
	readonly extraWidgets?: Record<string, DockviewWidget<any>>
	readonly tabs?: Record<string, DockviewWidget<any>>
	readonly headerLeft?: DockviewHeaderAction
	readonly headerRight?: DockviewHeaderAction
	readonly headerPrefix?: DockviewHeaderAction
	readonly el?: JSX.GlobalHTMLAttributes
	readonly options?: DockviewOptions
	readonly layout?: SerializedDockview
	readonly notFound?: RouterNotFound<RouterModelRouteDefinition<Definition>>
	readonly loading?: RouterLoading<RouterModelRouteDefinition<Definition>>
	readonly onRouteStart?: RouterOnRouteStart<Definition>
	readonly onRouteEnd?: RouterOnRouteEnd<Definition>
	readonly onRouteError?: RouterOnRouteError<Definition>
	readonly initialUrl?: string
	readonly initialUrls?: readonly string[]
}

function logDockviewRouter(
	debug: DockviewRouterProps<any>['debug'],
	event: string,
	payload?: unknown
) {
	if (!debug) return
	const label = typeof debug === 'string' ? debug : 'DockviewRouter'
	if (payload === undefined) {
		console.log(`[${label}] ${event}`)
		return
	}
	console.log(`[${label}] ${event}`, payload)
}

function isExactRouteMatch<Definition extends ClientRouteDefinition>(
	match: RouteSpecification<RouterModelRouteDefinition<Definition>> | null,
	route: RouterModelRouteDefinition<Definition>
): match is RouteSpecification<RouterModelRouteDefinition<Definition>> {
	return (
		!!match &&
		match.definition.path === route.path &&
		(match.unusedPath === '' || match.unusedPath === '/')
	)
}

function renderRoutePanel<Definition extends ClientRouteDefinition>(
	props: {
		model: RouterModel<Definition>
		route: RouterModelRouteDefinition<Definition>
		url: string
		routes: readonly RouterModelRouteDefinition<Definition>[]
		loading?: RouterLoading<RouterModelRouteDefinition<Definition>>
		notFound?: RouterNotFound<RouterModelRouteDefinition<Definition>>
	},
	scope: Record<PropertyKey, unknown>
): JSX.Element {
	function wrap(content: JSX.Element | JSX.Element[]): JSX.Element {
		return <div style="display: contents">{content}</div>
	}
	const match = props.model.matcher(props.url)
	if (!isExactRouteMatch(match, props.route)) {
		if (props.notFound) return wrap(props.notFound({ routes: props.routes, url: props.url }, scope))
		return <div data-testid="dockview-router-not-found">Route not found: {props.url}</div>
	}
	if ('view' in props.route && typeof props.route.view === 'function') {
		return wrap(props.route.view(match, scope))
	}
	if (props.route.loading) {
		return wrap(props.route.loading({ route: props.route, url: props.url }, scope))
	}
	if (props.loading) {
		return wrap(props.loading({ route: props.route, url: props.url }, scope))
	}
	return <div data-testid="dockview-router-loading">Loading route…</div>
}

function createRouteWidgets<Definition extends ClientRouteDefinition>(
	props: Pick<DockviewRouterProps<Definition>, 'routes' | 'extraWidgets' | 'loading' | 'notFound'>,
	model: RouterModel<Definition>
): Record<string, DockviewWidget<any>> {
	const widgets: Record<string, DockviewWidget<any>> = { ...(props.extraWidgets ?? {}) }
	for (const route of props.routes) {
		widgets[route.path] = (
			widgetProps: { params: DockviewRouteWidgetParams },
			widgetScope: Record<PropertyKey, unknown>
		) => {
			const url = String(widgetProps.params?.url ?? '')
			return renderRoutePanel(
				{
					model,
					route,
					url,
					routes: props.routes,
					loading: props.loading,
					notFound: props.notFound,
				},
				widgetScope
			)
		}
	}
	return widgets
}

function openRoutePanel<Definition extends ClientRouteDefinition>(
	api: DockviewApi,
	opened: OpenedRoute<Definition>,
	debug?: DockviewRouterProps<Definition>['debug']
) {
	const existing = api.panels.find((panel) => panel.id === opened.id)
	if (existing) {
		logDockviewRouter(debug, 'openRoutePanel:existing', {
			activePanelId: api.activePanel?.id,
			panelCount: api.panels.length,
			routeId: opened.id,
			url: opened.url,
		})
		existing.api.setActive()
		return existing
	}
	const candidate = api.activePanel ?? api.panels[0]
	const referencePanel =
		candidate && api.panels.some((p) => p.id === candidate.id) ? candidate : undefined
	logDockviewRouter(debug, 'openRoutePanel:add', {
		activePanelId: api.activePanel?.id,
		panelCount: api.panels.length,
		referencePanelId: referencePanel?.id,
		routeId: opened.id,
		url: opened.url,
	})
	const panel = api.addPanel({
		id: opened.id,
		title: opened.title,
		component: opened.match.definition.path,
		params: {
			...opened.match.params,
			url: opened.url,
			routeId: opened.id,
		},
		floating: false,
		...(referencePanel
			? { position: { referencePanel, direction: 'within' as const } }
			: { position: { direction: 'right' as const } }),
	})
	logDockviewRouter(debug, 'openRoutePanel:added', {
		activePanelId: api.activePanel?.id,
		panelCount: api.panels.length,
		routeId: opened.id,
		url: opened.url,
	})
	return panel
}

function openInitialRoutes<Definition extends ClientRouteDefinition>(
	api: DockviewApi,
	model: RouterModel<Definition>,
	urls: readonly string[],
	debug?: DockviewRouterProps<Definition>['debug']
) {
	for (const url of urls) {
		logDockviewRouter(debug, 'openInitialRoutes:open', { url })
		const opened = model.open(url)
		if (!opened) {
			logDockviewRouter(debug, 'openInitialRoutes:miss', { url })
			continue
		}
		openRoutePanel(api, opened, debug)
	}
}

function getClientRouteUrl() {
	return `${client.url.pathname}${client.url.search}`
}

function findOpenedRouteByUrl<Definition extends ClientRouteDefinition>(
	model: RouterModel<Definition>,
	url: string
) {
	for (let index = model.opened.length - 1; index >= 0; index -= 1) {
		const opened = model.opened[index]
		if (opened?.url === url) return opened
	}
	return null
}

function syncActiveRouteToUrl(
	activeUrl: string | undefined,
	currentUrl: string,
	replace: (url: string) => void = (url) => client.replace(url)
) {
	if (!activeUrl || activeUrl === currentUrl) return false
	replace(activeUrl)
	return true
}

function syncClientRouteToDockview<Definition extends ClientRouteDefinition>(
	api: DockviewApi,
	model: RouterModel<Definition>,
	context: {
		url: string
		navigation: NavigationKind
	},
	debug?: DockviewRouterProps<Definition>['debug']
) {
	if (!context.url) {
		logDockviewRouter(debug, 'syncClientRouteToDockview:skip-empty')
		return null
	}
	if (context.navigation !== 'push') {
		const activePanel = api.activePanel
		if (activePanel?.params?.url === context.url) {
			logDockviewRouter(debug, 'syncClientRouteToDockview:skip-active', {
				navigation: context.navigation,
				url: context.url,
			})
			return null
		}
		const existingPanel = api.panels.find((p) => p.params?.url === context.url)
		if (existingPanel) {
			model.activate(existingPanel.id)
			existingPanel.api.setActive()
			logDockviewRouter(debug, 'syncClientRouteToDockview:reuse-existing', {
				navigation: context.navigation,
				routeId: existingPanel.id,
				url: context.url,
			})
			return null
		}
	}
	logDockviewRouter(debug, 'syncClientRouteToDockview:open', {
		activeUrl: api.activePanel?.params?.url,
		navigation: context.navigation,
		url: context.url,
	})
	const opened = model.open(context.url)
	if (!opened) {
		logDockviewRouter(debug, 'syncClientRouteToDockview:miss', {
			navigation: context.navigation,
			url: context.url,
		})
		return null
	}
	openRoutePanel(api, opened, debug)
	logDockviewRouter(debug, 'syncClientRouteToDockview:opened', {
		panelCount: api.panels.length,
		routeId: opened.id,
		url: opened.url,
	})
	return opened
}

function reconcileDockviewRouteState<Definition extends ClientRouteDefinition>(
	api: DockviewApi,
	model: RouterModel<Definition>,
	debug?: DockviewRouterProps<Definition>['debug']
) {
	const panelIds = new Set(api.panels.map((panel) => panel.id))
	for (const opened of [...model.opened]) {
		if (!panelIds.has(opened.id)) {
			logDockviewRouter(debug, 'reconcileDockviewRouteState:close-missing', {
				panelCount: api.panels.length,
				routeId: opened.id,
				url: opened.url,
			})
			model.close(opened.id)
		}
	}
	const activePanel = api.activePanel ?? api.panels[0]
	if (!activePanel) {
		logDockviewRouter(debug, 'reconcileDockviewRouteState:no-active', {
			openedCount: model.opened.length,
			panelCount: api.panels.length,
		})
		return null
	}
	model.activate(activePanel.id)
	logDockviewRouter(debug, 'reconcileDockviewRouteState:active', {
		activePanelId: activePanel.id,
		activeUrl: model.active?.url,
		openedCount: model.opened.length,
		panelCount: api.panels.length,
	})
	return model.active
}

function bindDockviewRouter<Definition extends ClientRouteDefinition>(
	api: DockviewApi,
	model: RouterModel<Definition>,
	debug?: DockviewRouterProps<Definition>['debug']
) {
	let syncing = false
	const reconcileFromPanels = () => {
		logDockviewRouter(debug, 'bindDockviewRouter:sync-from-panels', {
			activePanelId: api.activePanel?.id,
			panelCount: api.panels.length,
		})
		reconcileDockviewRouteState(api, model, debug)
	}
	const syncActivePanelToUrl = () => {
		if (syncing) return
		logDockviewRouter(debug, 'bindDockviewRouter:sync-active-to-url', {
			activePanelId: api.activePanel?.id,
			panelCount: api.panels.length,
		})
		const active = reconcileDockviewRouteState(api, model, debug)
		syncActiveRouteToUrl(active?.url, getClientRouteUrl())
	}
	const onAdd = api.onDidAddPanel(reconcileFromPanels)
	const onRemove = api.onDidRemovePanel(reconcileFromPanels)
	const onActive = api.onDidActivePanelChange(syncActivePanelToUrl)
	const stopEffect = effect(() => {
		const context = {
			url: getClientRouteUrl(),
			navigation: client.history.navigation,
		}
		syncing = true
		try {
			syncClientRouteToDockview(api, model, context, debug)
		} finally {
			syncing = false
		}
	})
	return () => {
		logDockviewRouter(debug, 'bindDockviewRouter:dispose')
		onAdd.dispose()
		onRemove.dispose()
		onActive.dispose()
		stopEffect()
	}
}

export const DockviewRouter = <Definition extends ClientRouteDefinition>(
	inputProps: DockviewRouterProps<Definition>,
	scope: Record<PropertyKey, unknown>
) => {
	const props = defaults(inputProps, {})
	const initialUrls = inputProps.initialUrls?.length
		? [...inputProps.initialUrls]
		: inputProps.initialUrl
			? [inputProps.initialUrl]
			: []
	let nextRouteId = 0
	const model = routerModel<Definition>({
		routes: props.routes,
		notFound: props.notFound,
		onRouteStart: props.onRouteStart,
		onRouteEnd: props.onRouteEnd,
		onRouteError: props.onRouteError,
		getRouteId: props.getRouteId ?? ((_match, url) => `${url}#${++nextRouteId}`),
	})
	const widgets = createRouteWidgets(props, model)
	let stopBindings: (() => void) | undefined
	const onReady = (api: DockviewApi) => {
		logDockviewRouter(props.debug, 'setup:ready', {
			initialUrls,
			panelCount: api.panels.length,
		})
		openInitialRoutes(api, model, initialUrls, props.debug)
		reconcileDockviewRouteState(api, model, props.debug)
		stopBindings = bindDockviewRouter(api, model, props.debug)
	}
	const setup = () => {
		return () => {
			logDockviewRouter(props.debug, 'setup:dispose')
			stopBindings?.()
		}
	}
	try {
		;(scope as Record<string, unknown>).routerModel = model
	} catch (_error) {}
	return (
		<div use={setup} style="display: contents">
			<Dockview
				onReady={onReady}
				widgets={widgets}
				tabs={props.tabs}
				headerLeft={props.headerLeft}
				headerRight={props.headerRight}
				headerPrefix={props.headerPrefix}
				el={props.el}
				options={props.options}
				debug={props.debug}
				layout={props.layout}
			/>
		</div>
	)
}

export const dockviewRouterInternals = {
	bindDockviewRouter,
	createRouteWidgets,
	findOpenedRouteByUrl,
	getClientRouteUrl,
	reconcileDockviewRouteState,
	renderRoutePanel,
	syncActiveRouteToUrl,
	syncClientRouteToDockview,
	openInitialRoutes,
	openRoutePanel,
}

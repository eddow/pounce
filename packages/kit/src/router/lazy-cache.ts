import { matchRoute as coreMatchRoute, type RouteWildcard } from './logic.js'

type CacheRouteDefinition = {
	readonly path: RouteWildcard
	readonly lazy?: () => Promise<RouterRenderLike<any> | LazyRouteModuleLike<any>>
}

type RouterRenderLike<Definition extends { readonly path: RouteWildcard }> = (
	specification: {
		readonly definition: Definition
		readonly params: Record<string, string>
		readonly unusedPath: string
	},
	scope: Record<PropertyKey, unknown>
) => JSX.Element | JSX.Element[]

type LazyRouteModuleLike<Definition extends { readonly path: RouteWildcard }> = {
	readonly default?: RouterRenderLike<Definition>
	readonly view?: RouterRenderLike<Definition>
}

const registeredRoutes = new Set<readonly CacheRouteDefinition[]>()
const loadedViews = new Map<RouteWildcard, RouterRenderLike<any>>()
const pendingViews = new Map<RouteWildcard, Promise<RouterRenderLike<any>>>()

function hasLazyRoute(route: CacheRouteDefinition): route is CacheRouteDefinition & {
	readonly lazy: () => Promise<RouterRenderLike<any> | LazyRouteModuleLike<any>>
} {
	return typeof route.lazy === 'function'
}

function normalizeLazyView<Definition extends { readonly path: RouteWildcard }>(
	loaded: RouterRenderLike<Definition> | LazyRouteModuleLike<Definition>
): RouterRenderLike<Definition> {
	if (typeof loaded === 'function') return loaded
	if (typeof loaded.view === 'function') return loaded.view
	if (typeof loaded.default === 'function') return loaded.default
	throw new Error('Lazy route loader must resolve to a view function or a module with default/view')
}

export function registerPrefetchRoutes(routes: readonly CacheRouteDefinition[]): void {
	registeredRoutes.add(routes)
}

export function getLoadedRouteView<Definition extends { readonly path: RouteWildcard }>(
	path: RouteWildcard
): RouterRenderLike<Definition> | undefined {
	return loadedViews.get(path) as RouterRenderLike<Definition> | undefined
}

export function loadRouteView<Definition extends { readonly path: RouteWildcard }>(
	route: Definition & {
		readonly lazy: () => Promise<RouterRenderLike<Definition> | LazyRouteModuleLike<Definition>>
	}
): Promise<RouterRenderLike<Definition>> {
	const pending = pendingViews.get(route.path)
	if (pending) return pending as Promise<RouterRenderLike<Definition>>

	const started = route.lazy().then((loaded) => {
		const view = normalizeLazyView(loaded)
		loadedViews.set(route.path, view)
		return view
	})

	pendingViews.set(route.path, started)
	void started.finally(() => {
		pendingViews.delete(route.path)
	})
	return started
}

export function prefetchRoute(href: string): Promise<void> | undefined {
	for (const routes of registeredRoutes) {
		const match = coreMatchRoute(href, routes)
		if (!match) continue
		if (!hasLazyRoute(match.definition)) return undefined
		return loadRouteView(match.definition).then(() => undefined)
	}
	return undefined
}

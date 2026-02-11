import { compose, PounceElement } from '@pounce/core'
import { lift } from 'mutts'
import { client } from '../platform/shared.js'
import { perf } from '../perf.js'
import {
	matchRoute as coreMatchRoute,
	routeMatcher as coreRouteMatcher,
	type ParsedPathSegment,
	type ParsedQueryParam,
	type ParsedRoute,
	type RouteParamFormat,
	type RouteParams,
	type RouteWildcard,
} from './logic.js'

// Re-export core types
export type {
	ParsedPathSegment,
	ParsedQueryParam,
	ParsedRoute,
	RouteParamFormat,
	// RouteParams, // Hide from re-export to avoid conflict with defs.ts
	RouteWildcard,
}
export { buildRoute } from './logic.js'
// Node/SSR shim for MouseEvent if likely missing
type MouseEventShim = unknown
type SafeMouseEvent = typeof globalThis extends { MouseEvent: any } ? MouseEvent : MouseEventShim

// === ROUTER TYPES ===

/** Minimal route definition for client-side routing. */
export interface ClientRouteDefinition {
	readonly path: RouteWildcard
}

/** Result of a successful route match — passed to the route's `view` function. */
export type RouteSpecification<Definition extends ClientRouteDefinition> = {
	readonly definition: Definition
	readonly params: RouteParams
	readonly unusedPath: string
}

/** View function signature: receives the matched route spec and scope, returns JSX. */
export type RouterRender<Definition extends ClientRouteDefinition> = (
	specification: RouteSpecification<Definition>,
	scope: Record<PropertyKey, unknown>
) => JSX.Element | JSX.Element[]

/** Fallback renderer when no route matches. */
export type RouterNotFound<Definition extends ClientRouteDefinition> = (
	context: { url: string; routes: readonly Definition[] },
	scope: Record<PropertyKey, unknown>
) => JSX.Element | JSX.Element[]

/** Props for the `<Router>` component. */
export interface RouterProps<Definition extends ClientRouteDefinition> {
	readonly routes: readonly Definition[]
	readonly notFound: RouterNotFound<Definition>
}

/** Pre-compiled route matcher function. */
export type RouteAnalyzer<Definition extends ClientRouteDefinition> = (
	url: string
) => RouteSpecification<Definition> | null

// === MATCHER WRAPPERS ===

/** Match a URL against client route definitions. Wrapper around core `matchRoute`. */
export function matchRoute<Definition extends ClientRouteDefinition>(
	road: string,
	definitions: readonly Definition[]
): RouteSpecification<Definition> | null {
	const result = coreMatchRoute(road, definitions)
	if (!result) return null
	return {
		definition: result.definition,
		params: result.params,
		unusedPath: result.unusedPath,
	}
}

/** Create a reusable route matcher for client route definitions. */
export function routeMatcher<Definition extends ClientRouteDefinition>(
	routes: readonly Definition[]
): RouteAnalyzer<Definition> {
	const matcher = coreRouteMatcher(routes)
	return (url: string) => {
		const result = matcher(url)
		if (!result) return null
		return {
			definition: result.definition,
			params: result.params,
			unusedPath: result.unusedPath,
		}
	}
}

// === COMPONENTS ===

/**
 * Reactive router component.
 * Matches `client.url.pathname` against route definitions and renders the matching view.
 * Re-renders automatically when the URL changes.
 */
export const Router = <
	Definition extends ClientRouteDefinition & { readonly view: RouterRender<Definition> },
>(
	props: RouterProps<Definition>,
	scope: Record<PropertyKey, unknown>
) => {
	const state = compose(
		{
			get url() {
				return client.url.pathname
			},
		},
		props
	)
	const matcher = routeMatcher(state.routes)

	function renderElements(jsx: JSX.Element | JSX.Element[]): Node[] {
		const els = Array.isArray(jsx) ? jsx : [jsx]
		return els.flatMap((el) => {
			if (!(el instanceof PounceElement)) return []
			const nodes = el.render(scope)
			return Array.isArray(nodes) ? Array.from(nodes) : [nodes]
		})
	}

	const rendered = lift(function routerCompute() {
		try {
			perf?.mark('route:match:start')
			const match = matcher(state.url)
			perf?.mark('route:match:end')
			perf?.measure('route:match', 'route:match:start', 'route:match:end')
			if (match && (match.unusedPath === '' || match.unusedPath === '/')) {
				try {
					perf?.mark('route:render:start')
					const output = renderElements(match.definition.view(match, scope))
					perf?.mark('route:render:end')
					perf?.measure('route:render', 'route:render:start', 'route:render:end')
					return output
				} catch (err) {
					console.error('Router view error:', err)
					return renderElements(
						<div style="padding: 20px; border: 1px solid #ff6b6b; background-color: #ffe0e0; color: #d63031; margin: 20px;">
							<h2 style="margin-top: 0">Something went wrong</h2>
							<p>Error loading route.</p>
							<details>
								<summary>Error details</summary>
								<pre style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px; margin-top: 10px;">
									{err instanceof Error ? err.stack : String(err)}
								</pre>
							</details>
						</div>
					)
				}
			}
			perf?.mark('route:not-found:start')
			const output = renderElements(state.notFound({ routes: state.routes, url: state.url }, scope))
			perf?.mark('route:not-found:end')
			perf?.measure('route:not-found', 'route:not-found:start', 'route:not-found:end')
			return output
		} catch (err) {
			console.error('Router matching error:', err)
			return renderElements(
				<div style="padding: 20px; border: 1px solid #ff6b6b; background-color: #ffe0e0; color: #d63031; margin: 20px;">
					<h2>Something went wrong</h2>
					<p>Router error.</p>
				</div>
			)
		}
	})

	return new PounceElement(() => rendered, { tag: 'Router' })
}

/**
 * Client-side navigation link.
 * Intercepts clicks on internal hrefs (starting with `/`) and uses `client.navigate()`.
 * Automatically sets `aria-current="page"` when href matches current pathname.
 */
export function A(props: JSX.IntrinsicElements['a']) {
	function handleClick(event: SafeMouseEvent) {
		props.onClick?.(event)
		if (!event || event.defaultPrevented) {
			return
		}
		const href = props.href
		if (typeof href === 'string' && href.startsWith('/')) {
			event.preventDefault()
			if (client.url.pathname !== href) {
				perf?.mark('route:click:start')
				client.navigate(href)
				perf?.mark('route:click:end')
				perf?.measure('route:click', 'route:click:start', 'route:click:end')
			}
		}
	}

	return (
		<a
			{...props}
			onClick={handleClick}
			aria-current={
				props['aria-current'] ?? (client.url.pathname === props.href ? 'page' : undefined)
			}
		>
			{props.children}
		</a>
	)
}

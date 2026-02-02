import { effect, reactive } from 'mutts'
import {
	compose,
	copyObject,
} from '@pounce/core'
import { client } from '../client/shared.js'
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

export interface ClientRouteDefinition {
	readonly path: RouteWildcard
}

export type RouteSpecification<Definition extends ClientRouteDefinition> = {
	readonly definition: Definition
	readonly params: RouteParams
	readonly unusedPath: string
}

export interface RouterRender<Definition extends ClientRouteDefinition> {
	(specification: RouteSpecification<Definition>, scope: Record<PropertyKey, unknown>): JSX.Element | JSX.Element[]
}

export interface RouterNotFound<Definition extends ClientRouteDefinition> {
	(context: { url: string; routes: readonly Definition[] }, scope: Record<PropertyKey, unknown>): JSX.Element | JSX.Element[]
}

export interface RouterProps<Definition extends ClientRouteDefinition> {
	readonly routes: readonly Definition[]
	readonly notFound: RouterNotFound<Definition>
	readonly url?: string
}

export interface RouteAnalyzer<Definition extends ClientRouteDefinition> {
	(url: string): RouteSpecification<Definition> | null
}

// === MATCHER WRAPPERS ===

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
	const result: JSX.Element[] = reactive([])
	let oldMatch: RouteSpecification<Definition> | null = null

	function setResult(els: JSX.Element | JSX.Element[]) {
		result.length = 0
		if (Array.isArray(els)) {
			result.push(...els)
		} else {
			result.push(els)
		}
	}

	effect(() => {
		try {
			const match = matcher(state.url)
			if (match && (match.unusedPath === '' || match.unusedPath === '/')) {
				if (oldMatch?.definition !== match.definition) {
					try {
						setResult(match.definition.view(match, scope))
						oldMatch = match
					} catch (err) {
						console.error('Router view error:', err)
						setResult(
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
						oldMatch = match
					}
				} else copyObject(oldMatch, match)
			} else {
				setResult(state.notFound({ routes: state.routes, url: state.url }, scope))
				oldMatch = null
			}
		} catch (err) {
			console.error('Router matching error:', err)
			setResult(
				<div style="padding: 20px; border: 1px solid #ff6b6b; background-color: #ffe0e0; color: #d63031; margin: 20px;">
					<h2>Something went wrong</h2>
					<p>Router error.</p>
				</div>
			)
		}
	})

	return <>{() => result}</>
}

export function A(props: JSX.IntrinsicElements['a']) {
	function handleClick(event: SafeMouseEvent) {
		// @ts-ignore
		props.onClick?.(event)
		// @ts-ignore
		if (event.defaultPrevented) {
			return
		}
		const href = props.href
		if (typeof href === 'string' && href.startsWith('/')) {
			// @ts-ignore
			event.preventDefault()
			if (client.url.pathname !== href) {
				client.navigate(href)
			}
		}
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: a has onclick
		<a
			{...props}
			// biome-ignore lint/a11y/useValidAnchor: a has onclick
			// @ts-ignore
			onClick={handleClick}
			aria-current={
				props['aria-current'] ?? (client.url.pathname === props.href ? 'page' : undefined)
			}
		>
			{props.children}
		</a>
	)
}

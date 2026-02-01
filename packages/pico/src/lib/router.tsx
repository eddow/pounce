import { effect, reactive } from 'mutts'
import {
	compose,
	copyObject,
	buildRoute as coreBuildRoute,
	matchRoute as coreMatchRoute,
	routeMatcher as coreRouteMatcher,
	type ParsedPathSegment,
	type ParsedQueryParam,
	type ParsedRoute,
	type RouteParamFormat,
	type RouteParams,
	type RouteWildcard,
} from '@pounce/core'
import { browser } from './browser'

// Re-export core types and functions
export type {
	ParsedPathSegment,
	ParsedQueryParam,
	ParsedRoute,
	RouteParamFormat,
	RouteParams,
	RouteWildcard,
}
export { coreBuildRoute as buildRoute }

// === @pounce/pico SPECIFIC TYPES ===

export interface RouteDefinition {
	readonly path: RouteWildcard
}

/** @deprecated Use RouteParams from @pounce/core */
export type RouteParameters = RouteParams

export interface RouteSpecification<Definition extends RouteDefinition> {
	readonly definition: Definition
	params: RouteParams
	unusedPath: string
}

export type RouteAnalyzer<Definition extends RouteDefinition> = (
	url: string
) => RouteSpecification<Definition> | null

// === MATCHER WRAPPERS ===

/**
 * Match a URL against route definitions.
 * Wrapper around @pounce/core matchRoute with @pounce/pico types.
 */
export function matchRoute<Definition extends RouteDefinition>(
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

/**
 * Create a route matcher for efficient repeated matching.
 */
export function routeMatcher<Definition extends RouteDefinition>(
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

// === REACT COMPONENTS ===

type RouteRenderResult = JSX.Element | JSX.Element[]

export type RouterRender<Definition extends RouteDefinition> = (
	specification: RouteSpecification<Definition>,
	scope: Record<PropertyKey, unknown>
) => RouteRenderResult

export type RouterNotFound<Definition extends RouteDefinition> = (
	context: { url: string; routes: readonly Definition[] },
	scope: Record<PropertyKey, unknown>
) => RouteRenderResult

export interface RouterProps<Definition extends RouteDefinition> {
	readonly routes: readonly Definition[]
	readonly notFound: RouterNotFound<Definition>
	readonly url?: string
}

export const Router = <
	Definition extends RouteDefinition & { readonly view: RouterRender<Definition> },
>(
	props: RouterProps<Definition>,
	scope: Record<PropertyKey, unknown>
) => {
	const state = compose(
		{
			get url() {
				return browser.url.pathname
			},
		},
		props
	)
	const matcher = routeMatcher(state.routes)
	const result: JSX.Element[] = reactive([])
	let oldMatch: RouteSpecification<Definition> | null = null

	function setResult(els: RouteRenderResult) {
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
						// If view() throws, we want to show an error message.
						// Since ErrorBoundary doesn't catch async/reactive updates in this architecture,
						// Router must handle its own render errors.
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
	function handleClick(event: MouseEvent) {
		props.onClick?.(event)
		if (event.defaultPrevented) {
			return
		}
		const href = props.href
		if (typeof href === 'string' && href.startsWith('/')) {
			event.preventDefault()
			if (browser.url.pathname !== href) {
				browser.navigate(href)
			}
		}
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: a has onclick
		<a
			{...props}
			// biome-ignore lint/a11y/useValidAnchor: a has onclick
			onClick={handleClick}
			aria-current={
				(props['aria-current'] ?? browser.url.pathname === props.href) ? 'page' : undefined
			}
		>
			{props.children}
		</a>
	)
}

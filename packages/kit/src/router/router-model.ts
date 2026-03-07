import { reactive } from 'mutts'
import type {
	ClientRouteDefinition,
	RouteAnalyzer,
	RouterNavigationContext,
	RouterNavigationEndContext,
	RouterNavigationErrorContext,
	RouterNavigationStatus,
	RouterNotFound,
	RouterOnRouteEnd,
	RouterOnRouteError,
	RouterOnRouteStart,
	RouterRouteDefinition,
	RouteSpecification,
} from './components'
import { type RouteParams, routeMatcher } from './logic'

export type RouterTitle<Definition extends ClientRouteDefinition> =
	| string
	| ((params: RouteParams, route: RouterRouteDefinition<Definition>) => string)

export type RouterModelRouteDefinition<Definition extends ClientRouteDefinition> =
	RouterRouteDefinition<Definition> & {
		readonly title?: RouterTitle<Definition>
	}

export type OpenedRoute<Definition extends ClientRouteDefinition> = {
	readonly id: string
	readonly url: string
	readonly title: string
	readonly match: RouteSpecification<RouterModelRouteDefinition<Definition>>
}

export interface RouterModelConfig<Definition extends ClientRouteDefinition> {
	readonly routes: readonly RouterModelRouteDefinition<Definition>[]
	readonly notFound?: RouterNotFound<RouterModelRouteDefinition<Definition>>
	readonly onRouteStart?: RouterOnRouteStart<Definition>
	readonly onRouteEnd?: RouterOnRouteEnd<Definition>
	readonly onRouteError?: RouterOnRouteError<Definition>
	readonly getRouteId?: (
		match: RouteSpecification<RouterModelRouteDefinition<Definition>>,
		url: string
	) => string
}

export interface RouterModel<Definition extends ClientRouteDefinition> {
	readonly active: OpenedRoute<Definition> | null
	readonly opened: readonly OpenedRoute<Definition>[]
	readonly state: {
		readonly active: OpenedRoute<Definition> | null
		readonly opened: readonly OpenedRoute<Definition>[]
	}
	readonly matcher: RouteAnalyzer<RouterModelRouteDefinition<Definition>>
	open(url: string): OpenedRoute<Definition> | null
	close(id: string): void
	activate(id: string): void
	clear(): void
}

export function routerModel<Definition extends ClientRouteDefinition>(
	config: RouterModelConfig<Definition>
): RouterModel<Definition> {
	const matcher = routeMatcher(config.routes)
	const raw: {
		active: OpenedRoute<Definition> | null
		opened: OpenedRoute<Definition>[]
	} = { active: null, opened: [] }
	const state = reactive<{
		active: OpenedRoute<Definition> | null
		opened: OpenedRoute<Definition>[]
	}>({ active: null, opened: [] })

	function setActive(value: OpenedRoute<Definition> | null) {
		raw.active = value
		state.active = value
	}

	function createNavigationContext(
		url: string,
		match: RouteSpecification<RouterModelRouteDefinition<Definition>> | null
	): RouterNavigationContext<Definition> {
		return {
			from: raw.active?.url,
			to: url,
			navigation: 'load',
			route: (match?.definition ?? null) as RouterRouteDefinition<Definition> | null,
			match: (match ?? null) as RouteSpecification<RouterRouteDefinition<Definition>> | null,
		}
	}

	function emitRouteEnd(
		url: string,
		match: RouteSpecification<RouterModelRouteDefinition<Definition>> | null,
		status: RouterNavigationStatus
	) {
		config.onRouteEnd?.({
			...createNavigationContext(url, match),
			status,
		} as RouterNavigationEndContext<Definition>)
	}

	function emitRouteError(
		url: string,
		match: RouteSpecification<RouterModelRouteDefinition<Definition>> | null,
		error: unknown
	) {
		config.onRouteError?.({
			...createNavigationContext(url, match),
			error,
		} as RouterNavigationErrorContext<Definition>)
	}

	function getTitle(match: RouteSpecification<RouterModelRouteDefinition<Definition>>): string {
		const title = match.definition.title
		if (typeof title === 'function') return title(match.params, match.definition)
		if (typeof title === 'string') return title
		return match.definition.path
	}

	function getRouteId(
		match: RouteSpecification<RouterModelRouteDefinition<Definition>>,
		url: string
	): string {
		return config.getRouteId?.(match, url) ?? url
	}

	function open(url: string): OpenedRoute<Definition> | null {
		const match = matcher(url)
		config.onRouteStart?.(
			createNavigationContext(url, match) as RouterNavigationContext<Definition>
		)
		if (!match || (match.unusedPath !== '' && match.unusedPath !== '/')) {
			config.notFound?.({ routes: config.routes, url }, {})
			emitRouteEnd(url, null, 'not-found')
			return null
		}

		try {
			const id = getRouteId(match, url)
			const existing = raw.opened.find((entry) => entry.id === id)
			if (existing) {
				setActive(existing)
				emitRouteEnd(url, match, 'match')
				return existing
			}

			const opened: OpenedRoute<Definition> = {
				id,
				url,
				title: getTitle(match),
				match,
			}
			raw.opened.push(opened)
			state.opened.push(opened)
			setActive(opened)
			emitRouteEnd(url, match, 'match')
			return opened
		} catch (error) {
			emitRouteError(url, match, error)
			throw error
		}
	}

	function activate(id: string) {
		const existing = raw.opened.find((entry) => entry.id === id)
		if (!existing) return
		setActive(existing)
	}

	function close(id: string) {
		const index = raw.opened.findIndex((entry) => entry.id === id)
		if (index === -1) return
		const wasActive = raw.active?.id === id
		raw.opened.splice(index, 1)
		state.opened.splice(index, 1)
		if (!wasActive) return
		setActive(raw.opened[index] ?? raw.opened[index - 1] ?? null)
	}

	function clear() {
		raw.opened.length = 0
		state.opened.splice(0, state.opened.length)
		setActive(null)
	}

	return {
		get active() {
			return raw.active
		},
		get opened() {
			return raw.opened
		},
		get state() {
			return state
		},
		matcher,
		open,
		close,
		activate,
		clear,
	}
}

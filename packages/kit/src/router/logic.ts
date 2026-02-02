/**
 * Unified route parsing and matching for pounce ecosystem.
 *
 * Syntax: [paramName:format?]
 * - [id] — required string param
 * - [id:uuid] — required UUID param
 * - [page:integer?] — optional integer param (query only)
 * - [...slug] — catch-all (remaining path segments)
 *
 * @module
 */

// === TYPES ===

export type RouteWildcard = string

/** Supported parameter format types. */
export type RouteParamFormat = 'string' | 'number' | 'integer' | 'float' | 'uuid' | RegExp

// TODO: Add support for custom format types via registry

export type RouteParams = Record<string, string>

export interface ParsedPathSegment {
	readonly kind: 'literal' | 'param' | 'catchAll'
	readonly value?: string // for literal
	readonly name?: string // for param/catchAll
	readonly format?: RouteParamFormat // for param
}

export interface ParsedQueryParam {
	readonly key: string
	readonly name: string
	readonly format: RouteParamFormat
	readonly optional: boolean
}

export interface ParsedRoute {
	readonly path: readonly ParsedPathSegment[]
	readonly query: readonly ParsedQueryParam[]
}

export interface RouteMatch<T> {
	readonly definition: T
	readonly params: RouteParams
	readonly unusedPath: string
}

// === CONSTANTS ===

const PARAM_TOKEN_REGEX =
	/^(?<name>[A-Za-z_][\w-]*)(?::(?<format>[A-Za-z_][\w-]*))?(?<optional>\?)?$/

const UUID_REGEX =
	/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

// === PARSING ===

interface ParsedParamToken {
	readonly name: string
	readonly format: RouteParamFormat
	readonly optional: boolean
}

function normalizeFormat(format?: string): RouteParamFormat {
	if (!format) {
		return 'string'
	}

	const lowered = format.toLowerCase()
	switch (lowered) {
		case 'string':
			return 'string'
		case 'number':
			return 'number'
		case 'float':
			return 'float'
		case 'int':
		case 'integer':
			return 'integer'
		case 'uuid':
			return 'uuid'
		default:
			throw new Error(`Unsupported route parameter format: ${format}`)
	}
}

function parseParamToken(token: string): ParsedParamToken {
	const match = token.match(PARAM_TOKEN_REGEX)
	if (!match?.groups) {
		throw new Error(`Invalid route parameter token: [${token}]`)
	}

	const { name, format, optional } = match.groups
	return {
		name,
		format: normalizeFormat(format),
		optional: optional === '?',
	}
}

/**
 * Parse a single path segment into structured form.
 * Used internally and by @pounce/board for file-based routing.
 */
export function parsePathSegment(segment: string): ParsedPathSegment {
	// Catch-all: [...slug]
	if (segment.startsWith('[...') && segment.endsWith(']')) {
		const name = segment.slice(4, -1)
		return { kind: 'catchAll', name }
	}

	// Dynamic param: [id] or [id:uuid]
	if (segment.startsWith('[') && segment.endsWith(']')) {
		const param = parseParamToken(segment.slice(1, -1))
		if (param.optional) {
			throw new Error('Path parameters cannot be optional in route pattern')
		}
		return {
			kind: 'param',
			name: param.name,
			format: param.format,
		}
	}

	// Literal segment
	return { kind: 'literal', value: segment }
}

function parseQueryPart(query: string): ParsedQueryParam[] {
	return query
		.split('&')
		.filter((entry) => entry.length > 0)
		.map((entry) => {
			const equalIndex = entry.indexOf('=')
			const keyPart = equalIndex >= 0 ? entry.slice(0, equalIndex) : undefined
			const tokenPart = equalIndex >= 0 ? entry.slice(equalIndex + 1) : entry

			if (!tokenPart.startsWith('[') || !tokenPart.endsWith(']')) {
				throw new Error('Query parameters must use `[]` notation in route pattern')
			}

			const param = parseParamToken(tokenPart.slice(1, -1))
			const key = keyPart && keyPart.length > 0 ? keyPart : param.name

			return {
				key,
				name: param.name,
				format: param.format,
				optional: param.optional,
			}
		})
}

/**
 * Parse a route pattern into structured form.
 *
 * @example
 * parseRoute('/users/[id:uuid]/posts?page=[page:integer?]')
 */
export function parseRoute(pattern: RouteWildcard): ParsedRoute {
	let pathPart: string = pattern
	let queryPart = ''

	const queryIndex = pathPart.indexOf('?')
	if (queryIndex >= 0) {
		queryPart = pathPart.slice(queryIndex + 1)
		pathPart = pathPart.slice(0, queryIndex)
	}

	const trimmedPath = pathPart.startsWith('/') ? pathPart.slice(1) : pathPart
	const pathSegments = trimmedPath
		.split('/')
		.filter((segment) => segment.length > 0)
		.map(parsePathSegment)

	const query = queryPart.length > 0 ? parseQueryPart(queryPart) : []

	return { path: pathSegments, query }
}

// === MATCHING ===

interface DissectedUrl {
	readonly pathSegments: readonly string[]
	readonly queryString: string
	readonly hash: string
}

function dissectUrl(url: string): DissectedUrl {
	let pathPart = url
	let queryString = ''
	let hash = ''

	const hashIndex = pathPart.indexOf('#')
	if (hashIndex >= 0) {
		hash = pathPart.slice(hashIndex)
		pathPart = pathPart.slice(0, hashIndex)
	}

	const queryIndex = pathPart.indexOf('?')
	if (queryIndex >= 0) {
		queryString = pathPart.slice(queryIndex + 1)
		pathPart = pathPart.slice(0, queryIndex)
	}

	const trimmedPath = pathPart.startsWith('/') ? pathPart.slice(1) : pathPart
	const pathSegments = trimmedPath.split('/').filter((segment) => segment.length > 0)

	return { pathSegments, queryString, hash }
}

function safeDecode(segment: string): string {
	try {
		return decodeURIComponent(segment)
	} catch {
		return segment
	}
}

function matchesFormat(value: string, format: RouteParamFormat): boolean {
	if (format instanceof RegExp) {
		return format.test(value)
	}

	switch (format) {
		case 'string':
			return value.length > 0
		case 'integer':
			return /^-?\d+$/.test(value)
		case 'number':
		case 'float':
			return value.trim().length > 0 && Number.isFinite(Number(value))
		case 'uuid':
			return UUID_REGEX.test(value)
		default:
			return false
	}
}

interface PathMatchResult {
	readonly consumedSegments: number
	readonly params: Record<string, string>
}

function matchPath(
	segments: readonly ParsedPathSegment[],
	actualSegments: readonly string[]
): PathMatchResult | null {
	const params: Record<string, string> = {}
	let consumed = 0

	for (const spec of segments) {
		if (spec.kind === 'catchAll') {
			// Catch remaining segments
			const remaining = actualSegments.slice(consumed).map(safeDecode).join('/')
			if (spec.name) {
				params[spec.name] = remaining
			}
			return { consumedSegments: actualSegments.length, params }
		}

		if (consumed >= actualSegments.length) {
			return null
		}

		const actualRaw = actualSegments[consumed]
		const actual = safeDecode(actualRaw)

		if (spec.kind === 'literal') {
			if (actual !== spec.value) {
				return null
			}
		} else if (spec.kind === 'param') {
			if (!matchesFormat(actual, spec.format!)) {
				return null
			}
			if (spec.name) {
				params[spec.name] = actual
			}
		}

		consumed++
	}

	return { consumedSegments: consumed, params }
}

interface QueryMatchResult {
	readonly params: Record<string, string>
	readonly unusedQuery: string
}

function matchQuery(
	queryParams: readonly ParsedQueryParam[],
	queryString: string
): QueryMatchResult | null {
	if (queryParams.length === 0) {
		return { params: {}, unusedQuery: queryString }
	}

	const searchParams = new URLSearchParams(queryString)
	const params: Record<string, string> = {}

	for (const spec of queryParams) {
		const value = searchParams.get(spec.key)

		if (value === null) {
			if (!spec.optional) {
				return null
			}
			continue
		}

		if (!matchesFormat(value, spec.format)) {
			return null
		}

		params[spec.name] = value
		searchParams.delete(spec.key)
	}

	return { params, unusedQuery: searchParams.toString() }
}

function buildUnusedPath(
	actualSegments: readonly string[],
	consumedSegments: number,
	unusedQuery: string,
	hash: string
): string {
	const remainingSegments = actualSegments.slice(consumedSegments)
	let unusedPath = ''

	if (remainingSegments.length > 0) {
		unusedPath += `/${remainingSegments.join('/')}`
	}

	if (unusedQuery.length > 0) {
		unusedPath += `?${unusedQuery}`
	}

	if (hash.length > 0) {
		unusedPath += hash
	}

	return unusedPath
}

interface PreparedRoute<T> {
	readonly definition: T
	readonly parsed: ParsedRoute
}

function prepareRoute<T extends { path: string }>(definition: T): PreparedRoute<T> {
	return {
		definition,
		parsed: parseRoute(definition.path),
	}
}

function comparePreparedRoutes(a: PreparedRoute<unknown>, b: PreparedRoute<unknown>): number {
	const segmentDiff = b.parsed.path.length - a.parsed.path.length
	if (segmentDiff !== 0) {
		return segmentDiff
	}
	return b.parsed.query.length - a.parsed.query.length
}

function matchPreparedRoutes<T extends { path: string }>(
	url: string,
	preparedRoutes: readonly PreparedRoute<T>[]
): RouteMatch<T> | null {
	const dissected = dissectUrl(url)

	for (const prepared of preparedRoutes) {
		const { definition, parsed } = prepared
		const pathMatch = matchPath(parsed.path, dissected.pathSegments)
		if (!pathMatch) {
			continue
		}

		const queryMatch = matchQuery(parsed.query, dissected.queryString)
		if (!queryMatch) {
			continue
		}

		const unusedPath = buildUnusedPath(
			dissected.pathSegments,
			pathMatch.consumedSegments,
			queryMatch.unusedQuery,
			dissected.hash
		)

		return {
			definition,
			params: { ...pathMatch.params, ...queryMatch.params },
			unusedPath,
		}
	}

	return null
}

/**
 * Match a URL against a list of route definitions.
 *
 * @example
 * const match = matchRoute('/users/123', [{ path: '/users/[id]' }])
 * // match?.params.id === '123'
 * */
export function matchRoute<T extends { path: string }>(
	url: string,
	definitions: readonly T[]
): RouteMatch<T> | null {
	const prepared = definitions.map((d) => prepareRoute(d)).sort(comparePreparedRoutes)
	return matchPreparedRoutes(url, prepared)
}

/**
 * Create a reusable route matcher for a set of routes.
 * More efficient for repeated matching against the same routes.
 */
export function routeMatcher<T extends { path: string }>(
	routes: readonly T[]
): (url: string) => RouteMatch<T> | null {
	const preparedRoutes = routes.map((r) => prepareRoute(r)).sort(comparePreparedRoutes)
	return (url: string) => matchPreparedRoutes(url, preparedRoutes)
}

// === BUILDING ===

/**
 * Build a URL from a route pattern and parameters.
 *
 * @example
 * buildRoute('/users/[id]', { id: '42' }) // '/users/42'
 */
export function buildRoute(
	pattern: RouteWildcard,
	params: RouteParams = {},
	unusedPath?: string
): string {
	const parsed = parseRoute(pattern)
	const segments = parsed.path.map((segment) => {
		if (segment.kind === 'literal') {
			return segment.value!
		}

		if (segment.kind === 'catchAll') {
			const value = params[segment.name!]
			return value !== undefined ? value : ''
		}

		const value = params[segment.name!]
		if (value === undefined) {
			throw new Error(`Missing value for path parameter: ${segment.name}`)
		}

		return encodeURIComponent(value)
	})

	let url = `/${segments.join('/')}`
	if (url.length === 0) {
		url = '/'
	}
	if (url.length > 1 && url.endsWith('/')) {
		url = url.slice(0, -1)
	}

	const queryParts: string[] = []
	for (const spec of parsed.query) {
		const value = params[spec.name]
		if (value === undefined) {
			if (spec.optional) {
				continue
			}
			throw new Error(`Missing value for query parameter: ${spec.name}`)
		}
		queryParts.push(`${encodeURIComponent(spec.key)}=${encodeURIComponent(value)}`)
	}

	if (queryParts.length > 0) {
		url += `?${queryParts.join('&')}`
	}

	if (unusedPath) {
		if (/^[/?#]/.test(unusedPath)) {
			url += unusedPath
		} else {
			url += `/${unusedPath}`
		}
	}

	return url
}

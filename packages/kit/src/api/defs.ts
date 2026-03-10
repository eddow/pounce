import type { ApiClientInstance } from './base-client.js'
import type { ExtractPathParams } from './inference.js'

export type AssertSchema = {
	assert: (input: any) => any
}

type PathParams<P extends string> = ExtractPathParams<P>
type QueryParams<Q extends AssertSchema> = Parameters<Q['assert']>[0]
type AllParams<P extends string, Q extends AssertSchema | undefined> = Q extends AssertSchema
	? PathParams<P> & QueryParams<Q>
	: PathParams<P>

export interface RouteDefinition<
	Path extends string = string,
	QuerySchema extends AssertSchema = AssertSchema,
> {
	path: Path
	querySchema?: QuerySchema
	buildUrl: (params: any) => string
}

export type CallableRoute<
	Path extends string = string,
	QuerySchema extends AssertSchema = AssertSchema,
> = ((params: AllParams<Path, QuerySchema>) => ApiClientInstance<Path>) &
	RouteDefinition<Path, QuerySchema>

// Injected by api/index.ts after the singleton is created — avoids circular dep at evaluation time
let _api: ((url: string) => ApiClientInstance<string>) | undefined
export function _registerApi(apiFn: (url: string) => ApiClientInstance<string>): void {
	_api = apiFn
}

export function defineRoute<Path extends string, QuerySchema extends AssertSchema>(
	path: Path,
	querySchema?: QuerySchema
): CallableRoute<Path, QuerySchema> {
	const buildUrl = (params: any): string => {
		let url: string = path
		const queryParams = new URLSearchParams()
		const pathKeys = new Set<string>()

		for (const segment of path.split('/')) {
			if (segment.startsWith('[') && segment.endsWith(']')) {
				const isCatchAll = segment.startsWith('[...')
				const key = segment.slice(isCatchAll ? 4 : 1, -1)
				pathKeys.add(key)
				if (params[key] === undefined) throw new Error(`Missing path parameter: ${key}`)
				url = url.replace(segment, String(params[key]))
			}
		}

		if (querySchema) {
			const potentialQueryParams: Record<string, any> = {}
			for (const key in params) {
				if (!pathKeys.has(key)) potentialQueryParams[key] = params[key]
			}
			const parsedQuery = querySchema.assert(potentialQueryParams)
			for (const [key, value] of Object.entries(parsedQuery)) {
				if (value !== undefined && value !== null) queryParams.set(key, String(value))
			}
		}

		const qs = queryParams.toString()
		return qs ? `${url}?${qs}` : url
	}

	const fn = (params: AllParams<Path, QuerySchema>): ApiClientInstance<Path> => {
		if (!_api)
			throw new Error(
				'[pounce] api not initialised — import from @pounce/kit before calling a route'
			)
		return _api(buildUrl(params)) as ApiClientInstance<Path>
	}

	fn.path = path
	fn.querySchema = querySchema
	fn.buildUrl = buildUrl

	return fn as unknown as CallableRoute<Path, QuerySchema>
}

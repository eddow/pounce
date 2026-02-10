/** Parsed representation of the current URL. */
export interface ClientUrl {
	readonly href: string
	readonly origin: string
	readonly pathname: string
	readonly search: string
	readonly hash: string
	readonly segments: readonly string[]
	readonly query: Record<string, string>
}

/** Window inner dimensions. */
export interface ClientViewport {
	readonly width: number
	readonly height: number
}

/** Universal fallback for `DocumentVisibilityState`. */
export type VisibilityState = 'visible' | 'hidden'

/** Snapshot of the browser history state. */
export interface ClientHistoryState {
	readonly length: number
}

/** Text direction, auto-detected from `<html dir>`. */
export type Direction = 'ltr' | 'rtl'

/** Reactive browser state — all properties are tracked by mutts. */
export interface ClientState {
	url: ClientUrl
	viewport: ClientViewport
	history: ClientHistoryState
	focused: boolean
	visibilityState: VisibilityState
	devicePixelRatio: number
	online: boolean
	language: string
	timezone: string
	direction: Direction
}

/** Options for `client.navigate()`. */
export interface NavigateOptions {
	readonly replace?: boolean
	readonly state?: unknown
}

/**
 * Full client interface: reactive state + navigation methods.
 * In DOM: backed by real browser APIs. In Node: ALS-backed proxy per SSR request.
 */
export interface Client extends ClientState {
	navigate(to: string | URL, options?: NavigateOptions): void
	replace(to: string | URL, options?: Omit<NavigateOptions, 'replace'>): void
	reload(): void
	dispose(): void
	prefersDark(): boolean
}

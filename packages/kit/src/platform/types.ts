import type { Children, Env } from '@pounce/core'
import type { ScopedCallback } from 'mutts'

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

/** What caused the latest URL/history synchronization. */
export type NavigationKind = 'load' | 'push' | 'replace' | 'pop' | 'hash'

/** Snapshot of the browser history state. */
export interface ClientHistoryState {
	readonly length: number
	readonly navigation: NavigationKind
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
	prefersDark: boolean
}

/** Options for `client.navigate()`. */
export interface NavigateOptions {
	readonly replace?: boolean
	readonly state?: unknown
}

/**
 * Full client interface: reactive state + navigation methods.
 */
export interface Client extends ClientState {
	navigate(to: string | URL, options?: NavigateOptions): void
	replace(to: string | URL, options?: Omit<NavigateOptions, 'replace'>): void
	reload(): void
	dispose(): void
}

export type HeadMount = (content: Children, env?: Env) => ScopedCallback

/**
 * Platform adapter — the contract between kit and its environment.
 *
 * Kit defines this interface. Adapters implement it:
 * - **DOM adapter** (`kit/dom/`): real browser APIs
 * - **Test adapter** (`kit/test/`): global reactive client
 * - **SSR adapter** (provided by board or any SSR engine): ALS-backed client,
 *   request-scoped isolation — that's the adapter's business.
 *
 * Head injection: provide `mountHead()` so shared kit head management can mount additively in DOM/test and serialize through SSR adapters.
 */
export interface PlatformAdapter {
	/** Reactive client state singleton */
	readonly client: Client
	readonly mountHead?: HeadMount
}

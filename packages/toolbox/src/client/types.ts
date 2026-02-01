export interface ClientUrl {
	readonly href: string
	readonly origin: string
	readonly pathname: string
	readonly search: string
	readonly hash: string
	readonly segments: readonly string[]
	readonly query: Record<string, string>
}

export interface ClientViewport {
	readonly width: number
	readonly height: number
}

// Universal fallback for DocumentVisibilityState
export type VisibilityState = 'visible' | 'hidden'

export interface ClientHistoryState {
	readonly length: number
}

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
}

export interface NavigateOptions {
	readonly replace?: boolean
	readonly state?: unknown
}

export interface Client extends ClientState {
	navigate(to: string | URL, options?: NavigateOptions): void
	replace(to: string | URL, options?: Omit<NavigateOptions, 'replace'>): void
	reload(): void
	dispose(): void
	prefersDark(): boolean
}

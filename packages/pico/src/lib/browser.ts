import { reactive } from 'mutts'

export interface BrowserUrl {
	readonly href: string
	readonly origin: string
	readonly pathname: string
	readonly search: string
	readonly hash: string
	readonly segments: readonly string[]
	readonly query: Record<string, string>
}

export interface BrowserViewport {
	readonly width: number
	readonly height: number
}

export interface BrowserHistoryState {
	readonly length: number
}

export interface BrowserState {
	url: BrowserUrl
	viewport: BrowserViewport
	history: BrowserHistoryState
	focused: boolean
	visibilityState: DocumentVisibilityState
	devicePixelRatio: number
	online: boolean
	language: string
	timezone: string
}

export interface NavigateOptions {
	readonly replace?: boolean
	readonly state?: unknown
}

export interface Browser extends BrowserState {
	navigate(to: string | URL, options?: NavigateOptions): void
	replace(to: string | URL, options?: Omit<NavigateOptions, 'replace'>): void
	reload(): void
	dispose(): void
	prefersDark(): boolean
}

type MutableBrowser = Browser & {
	url: BrowserUrl
	viewport: BrowserViewport
	history: BrowserHistoryState
}

type CleanupFn = () => void

const DEFAULT_BASE_URL = 'http://localhost/'
const isBrowserEnvironment = typeof window !== 'undefined' && typeof document !== 'undefined'

const cleanupFns: CleanupFn[] = []

const state = reactive<MutableBrowser>({
	url: createUrlSnapshot(
		isBrowserEnvironment ? new URL(window.location.href) : new URL(DEFAULT_BASE_URL)
	),
	viewport: createViewportSnapshot(),
	history: createHistorySnapshot(),
	focused: getInitialFocusState(),
	visibilityState: getInitialVisibilityState(),
	devicePixelRatio: getInitialDevicePixelRatio(),
	online: getInitialOnlineState(),
	language: getInitialLanguage(),
	timezone: getInitialTimezone(),
	navigate,
	replace(to: string | URL, options?: Omit<NavigateOptions, 'replace'>) {
		navigate(to, { ...options, replace: true })
	},
	reload,
	dispose,
	// TODO: react when system preferences change?
	prefersDark: () => {
		if (!isBrowserEnvironment || typeof window === 'undefined') {
			return false
		}
		try {
			return window.matchMedia('(prefers-color-scheme: dark)').matches
		} catch {
			return false
		}
	},
})

const browser = state as Browser

if (isBrowserEnvironment) {
	initializeBrowserListeners()
}

export { browser }

function navigate(to: string | URL, options?: NavigateOptions): void {
	if (!isBrowserEnvironment) {
		return
	}

	const href = resolveHref(to)
	const stateData = options?.state ?? null

	if (options?.replace) {
		window.history.replaceState(stateData, '', href)
	} else {
		window.history.pushState(stateData, '', href)
	}

	synchronizeUrl()
}

function reload(): void {
	if (isBrowserEnvironment) {
		window.location.reload()
	}
}

function dispose(): void {
	while (cleanupFns.length > 0) {
		const fn = cleanupFns.pop()
		fn?.()
	}
}

function initializeBrowserListeners(): void {
	const syncViewport = () => {
		browser.viewport = createViewportSnapshot()
	}
	const syncDevicePixelRatio = () => {
		browser.devicePixelRatio = getInitialDevicePixelRatio()
	}
	const syncFocus = () => {
		browser.focused = getInitialFocusState()
	}
	const syncVisibility = () => {
		browser.visibilityState = document.visibilityState ?? 'hidden'
	}
	const syncOnline = () => {
		browser.online = getInitialOnlineState()
	}
	const syncLanguage = () => {
		browser.language = getInitialLanguage()
		browser.timezone = getInitialTimezone()
	}

	addWindowListener('popstate', synchronizeUrl)
	addWindowListener('hashchange', synchronizeUrl)
	interceptHistoryMethod('pushState')
	interceptHistoryMethod('replaceState')

	addWindowListener('resize', () => {
		syncViewport()
		syncDevicePixelRatio()
	})
	addWindowListener('focus', () => {
		syncFocus()
		syncVisibility()
	})
	addWindowListener('blur', syncFocus)
	const visibilityHandler = () => {
		syncVisibility()
		syncFocus()
	}
	document.addEventListener('visibilitychange', visibilityHandler)
	cleanupFns.push(() => document.removeEventListener('visibilitychange', visibilityHandler))
	addWindowListener('online', syncOnline)
	addWindowListener('offline', syncOnline)
	addWindowListener('languagechange', syncLanguage)
}

function synchronizeUrl(): void {
	if (!isBrowserEnvironment) {
		return
	}

	browser.url = createUrlSnapshot(new URL(window.location.href))
	browser.history = createHistorySnapshot()
}

function resolveHref(input: string | URL): string {
	if (typeof input === 'string') {
		return input
	}

	return input.toString()
}

function createUrlSnapshot(url: URL): BrowserUrl {
	const query: Record<string, string> = {}
	url.searchParams.forEach((value, key) => {
		query[key] = value
	})

	return {
		href: url.href,
		origin: url.origin,
		pathname: url.pathname,
		search: url.search,
		hash: url.hash,
		segments: extractSegments(url.pathname),
		query,
	}
}

function createViewportSnapshot(): BrowserViewport {
	if (!isBrowserEnvironment) {
		return { width: 0, height: 0 }
	}

	return {
		width: window.innerWidth,
		height: window.innerHeight,
	}
}

function createHistorySnapshot(): BrowserHistoryState {
	return {
		length: isBrowserEnvironment ? window.history.length : 0,
	}
}

function extractSegments(pathname: string): readonly string[] {
	return pathname.split('/').filter((segment) => segment.length > 0)
}

function getInitialFocusState(): boolean {
	if (!isBrowserEnvironment || typeof document.hasFocus !== 'function') {
		return false
	}

	try {
		return document.hasFocus()
	} catch (_error) {
		return false
	}
}

function getInitialVisibilityState(): DocumentVisibilityState {
	if (!isBrowserEnvironment) {
		return 'hidden'
	}

	return document.visibilityState ?? 'hidden'
}

function getInitialDevicePixelRatio(): number {
	if (!isBrowserEnvironment) {
		return 1
	}

	return typeof window.devicePixelRatio === 'number' && Number.isFinite(window.devicePixelRatio)
		? window.devicePixelRatio
		: 1
}

function getInitialOnlineState(): boolean {
	if (!isBrowserEnvironment || typeof navigator === 'undefined') {
		return true
	}

	return navigator.onLine ?? true
}

function getInitialLanguage(): string {
	if (!isBrowserEnvironment || typeof navigator === 'undefined') {
		return 'en-US'
	}

	return navigator.language ?? 'en-US'
}

function getInitialTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC'
	} catch (_error) {
		return 'UTC'
	}
}

function addWindowListener<K extends keyof WindowEventMap>(
	type: K,
	listener: (event: WindowEventMap[K]) => void
): void {
	if (!isBrowserEnvironment) {
		return
	}

	const handler = listener as EventListener
	window.addEventListener(type, handler)
	cleanupFns.push(() => window.removeEventListener(type, handler))
}

function interceptHistoryMethod(method: 'pushState' | 'replaceState'): void {
	if (!isBrowserEnvironment) {
		return
	}

	const history = window.history
	const original = history[method] as (...args: Parameters<History['pushState']>) => void
	const wrapped = function (this: History, ...args: Parameters<History['pushState']>) {
		original.apply(this, args)
		synchronizeUrl()
	}

	history[method] = wrapped as History['pushState']
	cleanupFns.push(() => {
		history[method] = original as History['pushState']
	})
}

import { client } from '../client/implementation.js'
import type { ClientHistoryState, ClientUrl, ClientViewport, NavigateOptions } from '../client/types.js'

export { client }

// --- Initialization ---

if (typeof window !== 'undefined') {
	initializeClientListeners()
	// Initial Sync
	synchronizeUrl()
	client.viewport = createViewportSnapshot()
	client.history = createHistorySnapshot()
	client.focused = getInitialFocusState()
	client.visibilityState = (document.visibilityState as any) ?? 'hidden'
	client.devicePixelRatio = getInitialDevicePixelRatio()
	client.online = getInitialOnlineState()
	client.language = getInitialLanguage()
	client.timezone = getInitialTimezone()
}

// --- API Overrides ---

client.navigate = (to: string | URL, options?: NavigateOptions): void => {
	const href = resolveHref(to)
	const stateData = options?.state ?? null

	if (options?.replace) {
		window.history.replaceState(stateData, '', href)
	} else {
		window.history.pushState(stateData, '', href)
	}

	synchronizeUrl()
}

client.replace = (to: string | URL, options?: Omit<NavigateOptions, 'replace'>): void => {
	client.navigate(to, { ...options, replace: true })
}

client.reload = (): void => {
	window.location.reload()
}

const cleanupFns: (() => void)[] = []

client.dispose = (): void => {
	while (cleanupFns.length > 0) {
		const fn = cleanupFns.pop()
		fn?.()
	}
}

client.prefersDark = (): boolean => {
	try {
		return window.matchMedia('(prefers-color-scheme: dark)').matches
	} catch {
		return false
	}
}

// --- Internals ---

function initializeClientListeners(): void {
	const syncViewport = () => {
		client.viewport = createViewportSnapshot()
	}
	const syncDevicePixelRatio = () => {
		client.devicePixelRatio = getInitialDevicePixelRatio()
	}
	const syncFocus = () => {
		client.focused = getInitialFocusState()
	}
	const syncVisibility = () => {
		client.visibilityState = (document.visibilityState as any) ?? 'hidden'
	}
	const syncOnline = () => {
		client.online = getInitialOnlineState()
	}
	const syncLanguage = () => {
		client.language = getInitialLanguage()
		client.timezone = getInitialTimezone()
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
	client.url = createUrlSnapshot(new URL(window.location.href))
	client.history = createHistorySnapshot()
}

// --- Helpers ---

function resolveHref(input: string | URL): string {
	if (typeof input === 'string') {
		return input
	}
	return input.toString()
}

function createUrlSnapshot(url: URL): ClientUrl {
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

function createViewportSnapshot(): ClientViewport {
	return {
		width: window.innerWidth,
		height: window.innerHeight,
	}
}

function createHistorySnapshot(): ClientHistoryState {
	return {
		length: window.history.length,
	}
}

function extractSegments(pathname: string): readonly string[] {
	return pathname.split('/').filter((segment) => segment.length > 0)
}

function getInitialFocusState(): boolean {
	if (typeof document.hasFocus !== 'function') return false
	try {
		return document.hasFocus()
	} catch (_error) {
		return false
	}
}

function getInitialDevicePixelRatio(): number {
	return typeof window.devicePixelRatio === 'number' && Number.isFinite(window.devicePixelRatio)
		? window.devicePixelRatio
		: 1
}

function getInitialOnlineState(): boolean {
	return navigator.onLine ?? true
}

function getInitialLanguage(): string {
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
	const handler = listener as EventListener
	window.addEventListener(type, handler)
	cleanupFns.push(() => window.removeEventListener(type, handler))
}

function interceptHistoryMethod(method: 'pushState' | 'replaceState'): void {
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

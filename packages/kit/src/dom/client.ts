import { getActiveEffect, reactive } from 'mutts'
import { perf } from '../perf.js'
import { setPlatform } from '../platform/shared.js'
import type {
	Client,
	ClientHistoryState,
	ClientUrl,
	ClientViewport,
	Direction,
	NavigateOptions,
	PlatformAdapter,
} from '../platform/types.js'

// --- Build the reactive client ---

const client = reactive({
	url: createUrlSnapshot(new URL('http://localhost/')),
	viewport: { width: 0, height: 0 } as ClientViewport,
	history: { length: 0 } as ClientHistoryState,
	focused: false,
	visibilityState: 'hidden' as const,
	devicePixelRatio: 1,
	online: true,
	language: 'en-US',
	timezone: 'UTC',
	direction: 'ltr' as Direction,
	navigate: (_to: string | URL, _options?: NavigateOptions) => {},
	replace: (_to: string | URL, _options?: Omit<NavigateOptions, 'replace'>) => {},
	reload: () => {},
	dispose: () => {},
	prefersDark: false,
}) as Client

const cleanupFns: (() => void)[] = []

if (typeof window !== 'undefined') {
	initializeClientListeners()
	synchronizeUrl()
	client.viewport = createViewportSnapshot()
	client.history = createHistorySnapshot()
	client.focused = getInitialFocusState()
	client.visibilityState = document.visibilityState === 'visible' ? 'visible' : 'hidden'
	client.devicePixelRatio = getInitialDevicePixelRatio()
	client.online = getInitialOnlineState()
	client.language = getInitialLanguage()
	client.timezone = getInitialTimezone()
	client.direction = getInitialDirection()
}

// --- API Overrides ---

client.navigate = (to: string | URL, options?: NavigateOptions): void => {
	perf?.mark('route:start')
	const href = resolveHref(to)
	const active = getActiveEffect()
	console.log(`[kit] client.navigate to: ${href} ActiveEffect=${(active as any)?.name ?? 'none'}`)
	const stateData = options?.state ?? null
	if (options?.replace) {
		window.history.replaceState(stateData, '', href)
	} else {
		window.history.pushState(stateData, '', href)
	}
	synchronizeUrl()
	perf?.mark('route:end')
	perf?.measure('route:navigate', 'route:start', 'route:end')
}

client.replace = (to: string | URL, options?: Omit<NavigateOptions, 'replace'>): void => {
	client.navigate(to, { ...options, replace: true })
}

client.reload = (): void => {
	window.location.reload()
}

client.dispose = (): void => {
	while (cleanupFns.length > 0) {
		const fn = cleanupFns.pop()
		fn?.()
	}
}

try {
	const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
	client.prefersDark = darkQuery.matches
	const syncDark = (e: MediaQueryListEvent) => {
		client.prefersDark = e.matches
	}
	darkQuery.addEventListener('change', syncDark)
	cleanupFns.push(() => darkQuery.removeEventListener('change', syncDark))
} catch {
	client.prefersDark = false
}

// --- Platform Adapter ---

const domAdapter: PlatformAdapter = {
	client,
}

setPlatform(domAdapter)
export { domAdapter }

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
		client.visibilityState = document.visibilityState === 'visible' ? 'visible' : 'hidden'
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

	const dirObserver = new MutationObserver(() => {
		client.direction = getInitialDirection()
	})
	dirObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] })
	cleanupFns.push(() => dirObserver.disconnect())
}

function synchronizeUrl(): void {
	perf?.mark('route:sync:start')
	client.url = createUrlSnapshot(new URL(window.location.href))
	console.log('synchronizeUrl: client.url.pathname is now:', client.url.pathname)
	client.history = createHistorySnapshot()
	perf?.mark('route:sync:end')
	perf?.measure('route:sync', 'route:sync:start', 'route:sync:end')
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

function getInitialDirection(): Direction {
	return (document.documentElement.dir as Direction) || 'ltr'
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

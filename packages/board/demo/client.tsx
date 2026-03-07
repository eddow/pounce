import { h, latch } from '@pounce/core'
import { buildRouteTree, getSSRData, getSSRId, matchRoute } from '@pounce/board/client'

let listenersInstalled = false

function readHydratedPageProps(pathname: string) {
	const id = getSSRId(pathname)
	if (typeof document === 'undefined') return undefined
	if (!document.getElementById(id)) return undefined
	return getSSRData<Record<string, unknown>>(id)
}

async function loadPageProps(pathname: string, params: Record<string, string>) {
	const hydrated = readHydratedPageProps(pathname)
	if (hydrated) return { params, ...hydrated }

	const response = await fetch(pathname, {
		headers: {
			'X-Pounce-Provide': 'true',
			Accept: 'application/json',
		},
	})

	if (!response.ok) return { params }

	const data = (await response.json()) as Record<string, unknown>
	return { params, ...data }
}

async function bootstrap() {
	// 1. Gather all routes via Vite glob (client-side)
	const globRoutes = import.meta.glob('./routes/**/*.{ts,tsx}')

	const loaders: Record<string, () => Promise<any>> = {}
	for (const [path, loader] of Object.entries(globRoutes)) {
		loaders[path] = loader as () => Promise<any>
	}

	// 2. Build the same route tree as the server
	const routeTree = await buildRouteTree('./routes', undefined, loaders)

	// 3. Match current location
	const match = matchRoute(window.location.pathname, routeTree)

	if (match?.component) {
		const pageProps = await loadPageProps(
			window.location.pathname + window.location.search,
			match.params as Record<string, string>
		)

		// 4. Wrap with layouts
		let app = h(match.component, pageProps)
		if (match.layouts) {
			for (let i = match.layouts.length - 1; i >= 0; i--) {
				const Layout = match.layouts[i]
				app = h(Layout, pageProps, app)
			}
		}

		// 5. Hydrate/Mount
		latch('#root', app)
	}

	// 6. Handle SPA navigation (simple version)
	if (!listenersInstalled) {
		listenersInstalled = true
		window.addEventListener('popstate', () => bootstrap())

		// Intercept link clicks
		document.addEventListener('click', (e) => {
			const link = (e.target as HTMLElement).closest('a')
			if (link && link.href.startsWith(window.location.origin)) {
				e.preventDefault()
				window.history.pushState({}, '', link.href)
				bootstrap()
			}
		})
	}
}

bootstrap()

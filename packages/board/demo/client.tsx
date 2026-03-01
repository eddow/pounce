import { h, latch } from '@pounce/core'
import { buildRouteTree, matchRoute } from '@pounce/board'

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
		// 4. Wrap with layouts
		let app = h(match.component, { params: match.params })
		if (match.layouts) {
			for (let i = match.layouts.length - 1; i >= 0; i--) {
				const Layout = match.layouts[i]
				app = h(Layout, { params: match.params }, app)
			}
		}

		// 5. Hydrate/Mount
		latch('#root', app)
	}

	// 6. Handle SPA navigation (simple version)
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

bootstrap()

export interface NavLink {
	title: string
	href: string
}

export interface NavSection {
	title: string
	links: NavLink[]
}

export const navigation: NavSection[] = [
	{
		title: 'Getting Started',
		links: [
			{ title: 'Overview', href: '/getting-started' },
			{ title: 'Concepts', href: '/getting-started/concepts' },
		],
	},
	{
		title: '@pounce/core',
		links: [
			{ title: 'Overview', href: '/core' },
			{ title: 'JSX Factory', href: '/core/jsx' },
			{ title: 'Components', href: '/core/components' },
			{ title: 'Directives', href: '/core/directives' },
			{ title: 'Scope', href: '/core/scope' },
			{ title: 'Compose', href: '/core/compose' },
			{ title: 'SSR', href: '/core/ssr' },
		],
	},
	{
		title: '@pounce/kit',
		links: [
			{ title: 'Overview', href: '/kit' },
			{ title: 'Router', href: '/kit/router' },
			{ title: 'Client State', href: '/kit/client' },
			{ title: 'Intl', href: '/kit/intl' },
			{ title: 'Storage', href: '/kit/storage' },
			{ title: 'CSS Utilities', href: '/kit/css' },
			{ title: 'API Client', href: '/kit/api' },
		],
	},
	{
		title: '@pounce/ui',
		links: [
			{ title: 'Overview', href: '/ui' },
			{ title: 'Button', href: '/ui/button' },
			{ title: 'Accordion', href: '/ui/accordion' },
			{ title: 'Card', href: '/ui/card' },
			{ title: 'Forms', href: '/ui/forms' },
			{ title: 'Overlays', href: '/ui/overlays' },
			{ title: 'Layout', href: '/ui/layout' },
			{ title: 'Progress', href: '/ui/progress' },
			{ title: 'Status', href: '/ui/status' },
			{ title: 'Stars', href: '/ui/stars' },
			{ title: 'ErrorBoundary', href: '/ui/error-boundary' },
			{ title: 'Menu', href: '/ui/menu' },
			{ title: 'Typography', href: '/ui/typography' },
			{ title: 'InfiniteScroll', href: '/ui/infinite-scroll' },
			{ title: 'Directives', href: '/ui/directives' },
			{ title: 'CSS Variables', href: '/ui/css-variables' },
			{ title: 'Display & Theme', href: '/ui/display' },
			{ title: 'Adapters', href: '/ui/adapter' },
		],
	},
	{
		title: 'Adapters',
		links: [
			{ title: 'Overview', href: '/adapters' },
			{ title: 'PicoCSS', href: '/adapters/pico' },
			{ title: 'Vanilla', href: '/adapters/vanilla' },
			{ title: 'Creating Adapters', href: '/adapters/creating' },
		],
	},
	{
		title: '@pounce/board',
		links: [
			{ title: 'Overview', href: '/board' },
			{ title: 'Routing', href: '/board/routing' },
			{ title: 'SSR Flow', href: '/board/ssr' },
			{ title: 'Middleware', href: '/board/middleware' },
		],
	},
	{
		title: 'Mutts',
		links: [
			{ title: 'Overview', href: '/mutts' },
			{ title: 'Signals', href: '/mutts/signals' },
			{ title: 'Collections', href: '/mutts/collections' },
			{ title: 'Zones', href: '/mutts/zones' },
		],
	},
	{
		title: 'Pure-glyf',
		links: [
			{ title: 'Overview', href: '/pure-glyf' },
			{ title: 'Usage', href: '/pure-glyf/usage' },
		],
	},
]

import '@picocss/pico/css/pico.min.css'
import { bindApp, type Scope } from '@pounce/core'
import './components/variants.scss'
import { enableDevTools } from 'mutts'
import { DarkModeButton } from './components/dark-mode-button'
import { AppShell } from './components/layout'
import { Menu } from './components/menu'
import { Router, type RouteWildcard, client } from '@pounce/toolbox'
import DebugActionsRoute from './routes/debug-directives'
import DebugErrorRoute from './routes/debug-error'
import DisplayRoute from './routes/display'
import DockviewRoute from './routes/dockview'
import DockviewHarshRoute from './routes/dockview-harsh'
import FormsRoute from './routes/forms'
import InfiniteScrollRoute from './routes/infinite-scroll'
import InteractionRoute from './routes/interaction'
import ToolbarRoute from './routes/toolbar'

enableDevTools()
// Stabilize contains() across realms in Playwright evaluations
if (typeof Element !== 'undefined' && typeof Element.prototype.contains === 'function') {
	try {
		const originalContains = Element.prototype.contains
		Element.prototype.contains = function (node: any): boolean {
			try {
				return originalContains.call(this, node)
			} catch {
				// Fallback: if node is not a Node from this realm, infer using activeElement
				try {
					const active = document.activeElement
					if (active) {
						return originalContains.call(this, active)
					}
				} catch (error) {
					console.error('Failed to fallback to activeElement:', error)
					return false
				}
				return false
			}
		}
	} catch {
		// no-op
	}
}

const OverviewSection = () => (
	<section>
		<h2>Overview</h2>
		<p>Select a section from the menu to explore the component demos.</p>
	</section>
)

type DemoSection = {
	readonly path: RouteWildcard
	readonly label: string
	readonly view: (props: {}, scope: Scope) => JSX.Element
}

const sections: DemoSection[] = [
	{ path: '/display', label: 'Display', view: DisplayRoute },
	{ path: '/forms', label: 'Forms', view: FormsRoute },
	{ path: '/interaction', label: 'Interaction', view: InteractionRoute },
	{ path: '/infinite-scroll', label: 'Infinite Scroll', view: InfiniteScrollRoute },
	{ path: '/dockview', label: 'Dockview', view: DockviewRoute },
	{ path: '/dockview-harsh', label: 'Dockview Harsh', view: DockviewHarshRoute },
	{ path: '/toolbar', label: 'Toolbar', view: ToolbarRoute },
	{ path: '/debug-directives', label: 'Directives (All)', view: DebugActionsRoute },
	{ path: '/debug-error', label: 'Debug Error', view: DebugErrorRoute },
	{ path: '/', label: 'Overview', view: OverviewSection },
]

const renderNotFound = (props: { url: string }) => (
	<section>
		<h2>Not found</h2>
		<p>
			No demo is registered for <code>{props.url}</code>.
		</p>
	</section>
)

import { ErrorBoundary } from './components/error-boundary'
import { badge, intersect, pointer, resize, scroll } from './directives'

const App = (_props: {}, scope: Scope) => {
	scope.resize = resize
	scope.scroll = scroll
	scope.intersect = intersect
	scope.pointer = pointer
	scope.badge = badge
	return (
		<AppShell
			header={
				<header>
					<nav class="container pp-menu-nav">
						<Menu.Bar
							brand="Pounce UI"
							trailing={<DarkModeButton theme={scope.theme} />}
							items={sections.map(({ path, label }) => (
								<Menu.Item href={`${path}${client.url.hash ?? ''}`}>{label}</Menu.Item>
							))}
						/>
					</nav>
				</header>
			}
		>
			<main class="container">
				<ErrorBoundary>
					<Router routes={sections} notFound={renderNotFound} />
				</ErrorBoundary>
			</main>
		</AppShell>
	)
}

bindApp(<App />, '#app')

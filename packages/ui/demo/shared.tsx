import type { Scope } from '@pounce/core'
import { A, Router, type RouteWildcard } from '@pounce/kit/dom'
import { AppShell, ErrorBoundary, StandardOverlays } from '../src'
import { badge, intersect, pointer, resize, scroll } from '../src/directives'
import DisplayRoute from './routes/display'
import FormsRoute from './routes/forms'
import OverlaysRoute from './routes/overlays'
import LayoutRoute from './routes/layout'

export type DemoSection = {
	readonly path: RouteWildcard
	readonly label: string
	readonly view: (props: {}, scope: Scope) => JSX.Element
}

export const baseRoutes: DemoSection[] = [
	{ path: '/display', label: 'Display', view: DisplayRoute },
	{ path: '/forms', label: 'Forms', view: FormsRoute },
	{ path: '/overlays', label: 'Overlays', view: OverlaysRoute },
	{ path: '/layout', label: 'Layout', view: LayoutRoute },
]

export type DemoAppOptions = {
	title: string
	subtitle: string
	extraRoutes?: DemoSection[]
}

export function DemoApp(options: DemoAppOptions) {
	const sections: DemoSection[] = [
		...baseRoutes,
		...(options.extraRoutes ?? []),
		{
			path: '/',
			label: 'Overview',
			view: () => (
				<section style="padding: 2rem 0;">
					<h2 style="margin: 0 0 0.5rem;">{options.title}</h2>
					<p style="color: var(--pounce-fg-muted, #666);">
						{options.subtitle}
					</p>
				</section>
			),
		},
	]

	const renderNotFound = (context: { url: string; routes: readonly DemoSection[] }) => (
		<section style="padding: 2rem 0;">
			<h2>Not found</h2>
			<p>No demo is registered for <code>{context.url}</code>.</p>
		</section>
	)

	return (_props: {}, scope: Scope) => {
		scope.resize = resize
		scope.scroll = scroll
		scope.intersect = intersect
		scope.pointer = pointer
		scope.badge = badge
		return (
			<StandardOverlays>
				<AppShell
					header={
						<header style="background: var(--pounce-bg, #fff); border-bottom: 1px solid var(--pounce-border, rgba(0,0,0,0.1)); padding: 0 1rem;">
							<nav style="max-width: 960px; margin: 0 auto; display: flex; align-items: center; gap: 1.5rem; height: 3.5rem;">
								<strong style="font-size: 1.1rem;">{options.title}</strong>
								<div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
									<for each={sections}>
										{(section: DemoSection) => (
											<A
												href={section.path}
												style="text-decoration: none; color: var(--pounce-primary, #3b82f6); font-size: 0.9rem; font-weight: 500;"
											>
												{section.label}
											</A>
										)}
									</for>
								</div>
							</nav>
						</header>
					}
				>
					<main style="max-width: 960px; margin: 0 auto; padding: 1rem;">
						<ErrorBoundary fallback={(error) => (
							<div style="padding: 1rem; background: #fef2f2; border: 1px solid var(--pounce-danger); border-radius: 0.5rem; color: var(--pounce-danger);">
								<strong>Error:</strong> {error.message}
							</div>
						)}>
							<Router routes={sections} notFound={renderNotFound} />
						</ErrorBoundary>
					</main>
				</AppShell>
			</StandardOverlays>
		)
	}
}

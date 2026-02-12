import type { Scope } from '@pounce/core'
import { A, Router, type RouteWildcard } from '@pounce/kit/dom'
import { AppShell, Container, ErrorBoundary, Heading, Inline, Link, StandardOverlays, Text, ThemeToggle, Toolbar } from '../src'
import { Env, type EnvSettings } from '@pounce/kit/env'
import { reactive } from 'mutts'
import { badge, intersect, loading, pointer, resize, scroll } from '../src/directives'
import DisplayRoute from './routes/display'
import FormsRoute from './routes/forms'
import OverlaysRoute from './routes/overlays'
import LayoutRoute from './routes/layout'
import ThemeRoute from './routes/theme'
import { scope } from 'arktype'

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
	{ path: '/theme', label: 'Theme', view: ThemeRoute },
]

export type DemoAppOptions = {
	title: string
	subtitle: string
	extraRoutes?: DemoSection[]
}

export function DemoApp(options: DemoAppOptions) {
	const savedTheme = (() => {
		try { const v = localStorage.getItem('theme'); return v ? JSON.parse(v) : 'auto' }
		catch { return 'auto' }
	})()
	const envSettings = reactive<EnvSettings>({ theme: savedTheme })
	// Persist theme changes to localStorage
	const persistTheme = () => {
		try { localStorage.setItem('theme', JSON.stringify(envSettings.theme ?? 'auto')) } catch { /* noop */ }
	}
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
		scope.loading = loading
		return (
			<Env settings={envSettings}>
				<StandardOverlays>
					<AppShell
						header={
							<header>
								<Container>
									<Toolbar>
										<Heading level={5}>{options.title}</Heading>
										<Toolbar.Spacer />
										<Inline gap="sm" wrap>
											<for each={sections}>
												{(section: DemoSection) => (
													<Link href={section.path} underline={false}>
														{section.label}
													</Link>
												)}
											</for>
											<ThemeToggle settings={envSettings} simple />
										</Inline>
									</Toolbar>
								</Container>
							</header>
						}
					>
						<Container tag="main" style="padding: 1rem 0;">
							<ErrorBoundary fallback={(error) => (
								<Text variant="danger">
									<strong>Error:</strong> {error.message}
								</Text>
							)}>
								<Router routes={sections} notFound={renderNotFound} />
							</ErrorBoundary>
						</Container>
					</AppShell>
				</StandardOverlays>
			</Env>
		)
	}
}

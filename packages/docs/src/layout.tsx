import {
	Container,
	client,
	DisplayProvider,
	type Env,
	Heading,
	Router,
	r,
	sizeable,
	stored,
	Text,
	ThemeToggle,
	type ThemeValue,
	Toolbar,
} from '@pounce'
import { reactive } from 'mutts'
import PageNav from './components/page-nav'
import Search from './components/search'
import routes from './routes'

const DEFAULT_WIDTH = 300

const envSettings = reactive<{ theme: ThemeValue }>({ theme: 'auto' })
const uiState = reactive({ mobileOpen: false })

// Use stored to persist sidebar width
const sidebarState = stored({ width: DEFAULT_WIDTH })

function scrollToHashTarget() {
	const hash = client.url.hash
	if (!hash) return
	const targetId = decodeURIComponent(hash.slice(1))
	if (!targetId) return
	requestAnimationFrame(() => {
		document.getElementById(targetId)?.scrollIntoView({ block: 'start' })
	})
}

export function DocsApp(_props: {}, _env: Env) {
	const sizeableSidebar = sizeable(
		r(
			() => sidebarState.width,
			(v) => {
				sidebarState.width = v
			}
		)
	)
	const closeMobileNav = () => {
		uiState.mobileOpen = false
	}
	return (
		<DisplayProvider theme={envSettings.theme}>
			<div
				class={{ 'docs-layout': true, 'mobile-open': uiState.mobileOpen }}
				style={{ '--sizeable-width': `${sidebarState.width}px` }}
			>
				<aside class="docs-sidebar" use={sizeableSidebar}>
					<h5>Pounce</h5>
					<Search onNavigate={closeMobileNav} />
					<PageNav onNavigate={closeMobileNav} />
				</aside>
				<div class="docs-main">
					<header class="docs-header">
						<Container>
							<Toolbar>
								<button
									class="mobile-toggle"
									onClick={() => (uiState.mobileOpen = !uiState.mobileOpen)}
								>
									☰
								</button>
								<Heading level={5}>Pounce Docs</Heading>
								<Toolbar.Spacer />
								<ThemeToggle settings={envSettings} simple />
							</Toolbar>
						</Container>
					</header>
					<Container tag="main" el={{ style: 'padding: 2rem 0;' }}>
						<Router
							routes={routes}
							onRouteEnd={() => {
								closeMobileNav()
								scrollToHashTarget()
							}}
							notFound={({ url }: { url: string }) => (
								<section style="padding: 2rem 0;">
									<Heading level={2}>Not found</Heading>
									<Text>
										No page at <code>{url}</code>.
									</Text>
								</section>
							)}
						/>
					</Container>
				</div>
			</div>
		</DisplayProvider>
	)
}

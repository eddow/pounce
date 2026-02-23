import {
	Container,
	DisplayProvider,
	type Env,
	Heading,
	Router,
	Text,
	ThemeToggle,
	type ThemeValue,
	Toolbar,
} from '@pounce'
import { stored } from '@pounce/kit'
import { sizeable } from '@pounce/ui'
import { reactive } from 'mutts'
import PageNav from './components/page-nav'
import Search from './components/search'
import routes from './routes'

const DEFAULT_WIDTH = 300

const envSettings = reactive<{ theme: ThemeValue }>({ theme: 'auto' })
const uiState = reactive({ mobileOpen: false })

// Use stored to persist sidebar width
const sidebarState = stored({ width: DEFAULT_WIDTH })

export function DocsApp(_props: {}, env: Env) {
	env.sizeable = sizeable
	return (
		<DisplayProvider theme={envSettings.theme}>
			<div
				class={{ 'docs-layout': true, 'mobile-open': uiState.mobileOpen }}
				use={(el: HTMLElement) => {
					el.style.setProperty('--sidebar-width', `${sidebarState.width}px`)
				}}
			>
				<aside class="docs-sidebar">
					<h5>Pounce</h5>
					<Search />
					<PageNav />
				</aside>
				<div class="docs-sidebar-resize" use:sizeable={sidebarState.width} />
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

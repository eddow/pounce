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
import { reactive } from 'mutts'
import PageNav from './components/page-nav'
import Search from './components/search'
import routes from './routes'

const SIDEBAR_WIDTH_KEY = 'docs-sidebar-width'
const DEFAULT_WIDTH = 300

const envSettings = reactive<{ theme: ThemeValue }>({ theme: 'auto' })
const uiState = reactive({ mobileOpen: false })

function initSidebarWidth(layout: HTMLElement) {
	const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY)
	const width = stored ? Number(stored) : DEFAULT_WIDTH
	layout.style.setProperty('--sidebar-width', `${width}px`)
}

function startResize(e: MouseEvent, layout: HTMLElement, handle: HTMLElement) {
	e.preventDefault()
	handle.classList.add('dragging')
	document.body.style.cursor = 'col-resize'
	document.body.style.userSelect = 'none'

	const onMove = (ev: MouseEvent) => {
		const rect = layout.getBoundingClientRect()
		const width = Math.min(520, Math.max(180, ev.clientX - rect.left))
		layout.style.setProperty('--sidebar-width', `${width}px`)
	}

	const onUp = (ev: MouseEvent) => {
		handle.classList.remove('dragging')
		document.body.style.cursor = ''
		document.body.style.userSelect = ''
		const rect = layout.getBoundingClientRect()
		const width = Math.min(520, Math.max(180, ev.clientX - rect.left))
		localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width))
		document.removeEventListener('mousemove', onMove)
		document.removeEventListener('mouseup', onUp)
	}

	document.addEventListener('mousemove', onMove)
	document.addEventListener('mouseup', onUp)
}

export function DocsApp(_props: {}, _env: Env) {
	return (
		<DisplayProvider theme={envSettings.theme}>
			<div
				class={{ 'docs-layout': true, 'mobile-open': uiState.mobileOpen }}
				use={(el: HTMLElement) => initSidebarWidth(el)}
			>
				<aside class="docs-sidebar">
					<h5>Pounce</h5>
					<Search />
					<PageNav />
				</aside>
				<div
					class="docs-sidebar-resize"
					use={(el: HTMLElement) => {
						const layout = el.closest('.docs-layout') as HTMLElement
						el.addEventListener('mousedown', (e: MouseEvent) => startResize(e, layout, el))
					}}
				/>
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

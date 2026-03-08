import { latch } from '@pounce/core'
import {
	type ClientRouteDefinition,
	type LinkProps,
	linkModel,
	Router,
	type RouterRender,
} from '@pounce/kit'
import AccordionDemo from './components/AccordionDemo'
import CheckButtonDemo from './components/CheckButtonDemo'
import DisplayContextDemo from './components/DisplayContextDemo'
import DockviewDemo from './components/DockviewDemo'
import DockviewRouterDemo from './components/DockviewRouterDemo'
import FormDemo from './components/FormDemo'
import MenuDemo from './components/MenuDemo'
import MultiSelectDemo from './components/MultiSelectDemo'
import OverlayDemo from './components/OverlayDemo'
import ProgressDemo from './components/ProgressDemo'
import SizeableDemo from './components/SizeableDemo'
import StarsDemo from './components/StarsDemo'

function AppLink(props: LinkProps) {
	const model = linkModel(props)
	return (
		<a
			{...props}
			{...model}
		>
			{props.children}
		</a>
	)
}

type DemoRoute = ClientRouteDefinition & {
	href?: string
	label: string | null
	view: RouterRender<DemoRoute>
}

const routes: DemoRoute[] = [
	{ path: '/', label: 'Form', view: () => <FormDemo /> },
	{ path: '/overlay', label: 'Overlays', view: () => <OverlayDemo /> },
	{ path: '/drawer', label: null, view: () => <OverlayDemo /> },
	{ path: '/accordion', label: 'Accordion', view: () => <AccordionDemo /> },
	{ path: '/checkbutton', label: 'CheckButton', view: () => <CheckButtonDemo /> },
	{ path: '/dockview', label: 'Dockview', view: () => <DockviewDemo /> },
	{
		path: '/dockview-router/[...route]',
		href: '/dockview-router',
		label: 'DockviewRouter',
		view: () => <DockviewRouterDemo />,
	},
	{ path: '/menu', label: 'Menu', view: () => <MenuDemo /> },
	{ path: '/multiselect', label: 'MultiSelect', view: () => <MultiSelectDemo /> },
	{ path: '/progress', label: 'Progress', view: () => <ProgressDemo /> },
	{ path: '/sizeable', label: 'Sizeable', view: () => <SizeableDemo /> },
	{ path: '/stars', label: 'Stars', view: () => <StarsDemo /> },
	{ path: '/display-context', label: 'DisplayContext', view: () => <DisplayContextDemo /> },
	{ path: '/themetoggle', label: null, view: () => <DisplayContextDemo /> },
	{ path: '/toast', label: null, view: () => <OverlayDemo /> },
]

function DemoApp() {
	return (
		<div
			data-test="demo-app"
			style="padding: clamp(12px, 3vw, 24px); max-width: 1000px; margin: 0 auto; width: min(100%, 1000px); box-sizing: border-box; font-family: sans-serif;"
		>
			<h1 style="color: #f1f5f9; margin-bottom: 8px;">@pounce/ui Demo</h1>
			<p style="color: #94a3b8; margin-bottom: 32px;">
				Headless UI primitives for Pounce applications
			</p>

			<nav
				data-test="demo-nav"
				style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #334155; padding-bottom: 16px;"
			>
				<for each={routes.filter((route) => route.label)}>
					{(route) => (
						<AppLink href={route.href ?? route.path}>
							<button style="padding: 6px 12px; border: none; border-radius: 4px; background: transparent; color: #94a3b8; cursor: pointer; font-weight: 500; white-space: nowrap;">
								{route.label}
							</button>
						</AppLink>
					)}
				</for>
			</nav>

			<main
				data-test="demo-content"
				style="background: #1e293b; padding: clamp(14px, 3vw, 24px); border-radius: 12px; border: 1px solid #334155;"
			>
				<Router routes={routes} notFound={() => <p style="color: #f87171;">404 - Not Found</p>} />
			</main>
		</div>
	)
}

latch('#app', <DemoApp />)

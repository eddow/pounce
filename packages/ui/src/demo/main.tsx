import { latch } from '@pounce/core'
import {
	type ClientRouteDefinition,
	type LinkProps,
	linkModel,
	Router,
	type RouterRender,
} from '@pounce/kit'
import AccordionDemo from './components/AccordionDemo'
import ButtonDemo from './components/ButtonDemo'
import CheckButtonDemo from './components/CheckButtonDemo'
import CheckboxDemo from './components/CheckboxDemo'
import DrawerDemo from './components/DrawerDemo'
import MenuDemo from './components/MenuDemo'
import MultiSelectDemo from './components/MultiSelectDemo'
import OverlayDemo from './components/OverlayDemo'
import ProgressDemo from './components/ProgressDemo'
import RadioButtonDemo from './components/RadioButtonDemo'
import SelectDemo from './components/SelectDemo'
import StarsDemo from './components/StarsDemo'
import ThemeToggleDemo from './components/ThemeToggleDemo'
import ToastDemo from './components/ToastDemo'

function A(props: LinkProps) {
	const model = linkModel(props)
	return (
		<a href={props.href} onClick={model.onClick} aria-current={model.ariaCurrent}>
			{props.children}
		</a>
	)
}

type DemoRoute = ClientRouteDefinition & { label: string | null; view: RouterRender<DemoRoute> }

const routes: DemoRoute[] = [
	{ path: '/', label: 'Button', view: () => <ButtonDemo /> },
	{ path: '/checkbox', label: 'Checkbox', view: () => <CheckboxDemo /> },
	{ path: '/checkbutton', label: 'CheckButton', view: () => <CheckButtonDemo /> },
	{ path: '/radiobutton', label: 'RadioButton', view: () => <RadioButtonDemo /> },
	{ path: '/select', label: 'Select', view: () => <SelectDemo /> },
	{ path: '/overlay', label: 'Overlay', view: () => <OverlayDemo /> },
	{ path: '/drawer', label: 'Drawer', view: () => <DrawerDemo /> },
	{ path: '/accordion', label: 'Accordion', view: () => <AccordionDemo /> },
	{ path: '/menu', label: 'Menu', view: () => <MenuDemo /> },
	{ path: '/multiselect', label: 'MultiSelect', view: () => <MultiSelectDemo /> },
	{ path: '/progress', label: 'Progress', view: () => <ProgressDemo /> },
	{ path: '/stars', label: 'Stars', view: () => <StarsDemo /> },
	{ path: '/themetoggle', label: 'ThemeToggle', view: () => <ThemeToggleDemo /> },
	{ path: '/toast', label: 'Toast', view: () => <ToastDemo /> },
]

function DemoApp() {
	return (
		<div style="padding: 24px; max-width: 800px; margin: 0 auto; font-family: sans-serif;">
			<h1 style="color: #f1f5f9; margin-bottom: 8px;">@pounce/ui Demo</h1>
			<p style="color: #94a3b8; margin-bottom: 32px;">
				Headless UI primitives for Pounce applications
			</p>

			<nav style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #334155; padding-bottom: 16px;">
				<for each={routes}>
					{(route) => (
						<A href={route.path}>
							<button style="padding: 6px 12px; border: none; border-radius: 4px; background: transparent; color: #94a3b8; cursor: pointer; font-weight: 500;">
								{route.label}
							</button>
						</A>
					)}
				</for>
			</nav>

			<main style="background: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
				<Router routes={routes} notFound={() => <p style="color: #f87171;">404 - Not Found</p>} />
			</main>
		</div>
	)
}

latch('#app', <DemoApp />)

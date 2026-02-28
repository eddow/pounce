import { latch } from '@pounce/core'
import { reactive, effect } from 'mutts'

const routes: Record<string, () => Promise<{ default: () => JSX.Element } | any>> = {
	'#Button': () => import('./fixtures/ButtonTests'),
	'#Checkbox': () => import('./fixtures/CheckboxTests'),
	'#CheckButton': () => import('./fixtures/CheckButtonTests'),
	'#RadioButton': () => import('./fixtures/RadioButtonTests'),
	'#Select': () => import('./fixtures/SelectTests'),
	'#Overlay': () => import('./fixtures/OverlayTests'),
	'#Drawer': () => import('./fixtures/DrawerTests'),
	'#Accordion': () => import('./fixtures/AccordionTests'),
	'#Menu': () => import('./fixtures/MenuTests'),
	'#MultiSelect': () => import('./fixtures/MultiSelectTests'),
	'#Progress': () => import('./fixtures/ProgressTests'),
	'#Stars': () => import('./fixtures/StarsTests'),
	'#ThemeToggle': () => import('./fixtures/ThemeToggleTests'),
	'#Toast': () => import('./fixtures/ToastTests'),
	'#Dockview': () => import('./fixtures/DockviewTests'),
}

function E2EApp() {
	const state = reactive({
		Component: null as any
	})

	effect(() => {
		const hash = window.location.hash || '#Button'
		const loader = routes[hash]
		if (loader) {
			loader().then(mod => {
				state.Component = mod.default
			})
		}
	})

	return (
		<div>
			{state.Component ? <state.Component /> : <div id="loading">Loading fixture...</div>}
		</div>
	)
}

latch('#root', <E2EApp />)

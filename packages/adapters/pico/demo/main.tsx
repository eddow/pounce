import { latch } from '@pounce/core'
import { mount, tablerSun, tablerMoon, tablerChevronDown, tablerCheck, tablerX, tablerPlus, tablerMinus, tablerSearch, tablerMenu, tablerAlertTriangle, tablerInfoCircle, tablerEye, tablerEyeOff, tablerSettings, tablerUser, tablerLogout, tablerBell, tablerStar, tablerHeart, tablerTrash, tablerEdit, tablerCopy, tablerClipboard, tablerArrowLeft, tablerArrowRight, tablerArrowUp, tablerArrowDown } from 'pure-glyf/icons'
import { setAdapter } from '../../../ui/src'
import { createGlyfIconFactory, picoAdapter } from '../src'
import '@picocss/pico/css/pico.min.css'
import '../src/pico-bridge.sass'
import { DemoApp } from '../../../ui/demo/shared'
import PicoFeaturesRoute from './routes/pico-features'

mount()

const iconFactory = createGlyfIconFactory({
	sun: tablerSun,
	moon: tablerMoon,
	'chevron-down': tablerChevronDown,
	check: tablerCheck,
	x: tablerX,
	plus: tablerPlus,
	minus: tablerMinus,
	search: tablerSearch,
	menu: tablerMenu,
	'alert-triangle': tablerAlertTriangle,
	'info-circle': tablerInfoCircle,
	eye: tablerEye,
	'eye-off': tablerEyeOff,
	settings: tablerSettings,
	user: tablerUser,
	logout: tablerLogout,
	bell: tablerBell,
	star: tablerStar,
	heart: tablerHeart,
	trash: tablerTrash,
	edit: tablerEdit,
	copy: tablerCopy,
	clipboard: tablerClipboard,
	'arrow-left': tablerArrowLeft,
	'arrow-right': tablerArrowRight,
	'arrow-up': tablerArrowUp,
	'arrow-down': tablerArrowDown,
})

setAdapter(picoAdapter, { iconFactory })

const App = DemoApp({
	title: 'Pounce UI — PicoCSS',
	subtitle: 'This demo uses the PicoCSS adapter with native Pico v2 styling.',
	extraRoutes: [
		{ path: '/pico', label: 'Pico Features', view: PicoFeaturesRoute },
	],
})

latch('#app', <App />)

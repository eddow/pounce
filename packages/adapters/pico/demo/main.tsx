import { bindApp } from '@pounce/core'
import { setAdapter } from '../../../ui/src'
import { picoAdapter } from '../src'
import '@picocss/pico/css/pico.min.css'
import '../src/pico-bridge.sass'
import { DemoApp } from '../../../ui/demo/shared'
import PicoFeaturesRoute from './routes/pico-features'

setAdapter(picoAdapter)

const App = DemoApp({
	title: 'Pounce UI — PicoCSS',
	subtitle: 'This demo uses the PicoCSS adapter with native Pico v2 styling.',
	extraRoutes: [
		{ path: '/pico', label: 'Pico Features', view: PicoFeaturesRoute },
	],
})

bindApp(<App />, '#app')

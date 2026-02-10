import { bindApp } from '@pounce/core'
import { vanilla } from '../src'
import { DemoApp } from './shared'

vanilla()

const App = DemoApp({
	title: 'Pounce UI — Vanilla',
	subtitle: 'This demo uses the built-in vanilla adapter — no external CSS framework required.',
})

bindApp(<App />, '#app')

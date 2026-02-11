import { bindApp } from '@pounce/core'
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'
import '@picocss/pico/css/pico.min.css'
import 'highlight.js/styles/github.css'
import './styles/docs.sass'
import { DocsApp } from './layout'

setAdapter(picoAdapter)

bindApp(<DocsApp />, '#app')

import { latch } from '@pounce'
import '@picocss/pico/css/pico.min.css'
import '@pounce/ui/styles/sizeable.sass'
import './styles/docs.sass'
import { ensureHighlightThemes } from './highlight-theme'
import { DocsApp } from './layout'

ensureHighlightThemes()
latch('#app', <DocsApp />)

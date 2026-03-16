import { latch } from '@sursaut'
import '@picocss/pico/css/pico.min.css'
import '@sursaut/ui/styles/sizeable.sass'
import './styles/docs.sass'
import './styles/theme-serene-confidence.css'
import { ensureHighlightThemes } from './highlight-theme'
import { DocsApp } from './layout'

ensureHighlightThemes()
latch('#app', <DocsApp />)

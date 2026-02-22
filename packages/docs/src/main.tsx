import { latch } from '@pounce'
import '@picocss/pico/css/pico.min.css'
import 'highlight.js/styles/github.css'
import './styles/docs.sass'
import { DocsApp } from './layout'

latch('#app', <DocsApp />)

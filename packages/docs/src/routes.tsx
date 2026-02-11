import type { Scope } from '@pounce/core'
import type { ClientRouteDefinition } from '@pounce/kit'
import IndexPage from './pages/index'
import GettingStartedPage from './pages/getting-started/index'
import ConceptsPage from './pages/getting-started/concepts'
import CorePage from './pages/core/index'
import JsxPage from './pages/core/jsx'
import ComponentsPage from './pages/core/components'
import DirectivesPage from './pages/core/directives'
import ScopePage from './pages/core/scope'
import ComposePage from './pages/core/compose'
import SSRPage from './pages/core/ssr'
import KitPage from './pages/kit/index'
import RouterPage from './pages/kit/router'
import ClientPage from './pages/kit/client'
import IntlPage from './pages/kit/intl'
import StoragePage from './pages/kit/storage'
import CSSPage from './pages/kit/css'
import UIPage from './pages/ui/index'
import ButtonPage from './pages/ui/button'
import AccordionPage from './pages/ui/accordion'
import CardPage from './pages/ui/card'
import OverlaysPage from './pages/ui/overlays'
import FormsPage from './pages/ui/forms'
import LayoutPage from './pages/ui/layout'
import ProgressPage from './pages/ui/progress'
import AdapterPage from './pages/ui/adapter'
import StatusPage from './pages/ui/status'
import StarsPage from './pages/ui/stars'
import ErrorBoundaryPage from './pages/ui/error-boundary'
import MenuPage from './pages/ui/menu'

// Route type that includes the view function
type AppRoute = ClientRouteDefinition & {
  readonly view: (spec: { params: Record<string, string> }, scope: Scope) => JSX.Element
}

const routes: AppRoute[] = [
  { path: '/', view: IndexPage },
  { path: '/getting-started', view: GettingStartedPage },
  { path: '/getting-started/concepts', view: ConceptsPage },
  { path: '/core', view: CorePage },
  { path: '/core/jsx', view: JsxPage },
  { path: '/core/components', view: ComponentsPage },
  { path: '/core/directives', view: DirectivesPage },
  { path: '/core/scope', view: ScopePage },
  { path: '/core/compose', view: ComposePage },
  { path: '/core/ssr', view: SSRPage },
  { path: '/kit', view: KitPage },
  { path: '/kit/router', view: RouterPage },
  { path: '/kit/client', view: ClientPage },
  { path: '/kit/intl', view: IntlPage },
  { path: '/kit/storage', view: StoragePage },
  { path: '/kit/css', view: CSSPage },
  { path: '/ui', view: UIPage },
  { path: '/ui/button', view: ButtonPage },
  { path: '/ui/accordion', view: AccordionPage },
  { path: '/ui/card', view: CardPage },
  { path: '/ui/overlays', view: OverlaysPage },
  { path: '/ui/forms', view: FormsPage },
  { path: '/ui/layout', view: LayoutPage },
  { path: '/ui/progress', view: ProgressPage },
  { path: '/ui/adapter', view: AdapterPage },
  { path: '/ui/status', view: StatusPage },
  { path: '/ui/stars', view: StarsPage },
  { path: '/ui/error-boundary', view: ErrorBoundaryPage },
  { path: '/ui/menu', view: MenuPage },
]

export default routes

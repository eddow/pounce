import type { Env } from '@pounce/core'
import { Router } from '@pounce/kit'
import { Container, Heading, Text, ThemeToggle, Toolbar } from '@pounce/ui'
import { Env, type EnvSettings } from '@pounce/kit/env'
import { reactive } from 'mutts'
import PageNav from './components/page-nav'
import Search from './components/search'
import routes from './routes'

const envSettings = reactive<EnvSettings>({ theme: 'auto' })
const uiState = reactive({ mobileOpen: false })

export function DocsApp(_props: {}, _env: Env) {
  return (
    <Env settings={envSettings}>
      <div class={{ 'docs-layout': true, 'mobile-open': uiState.mobileOpen }}>
        <aside class="docs-sidebar">
          <h5>Pounce</h5>
          <Search />
          <PageNav />
        </aside>
        <div class="docs-main">
          <header class="docs-header">
            <Container>
              <Toolbar>
                <button
                  class="mobile-toggle"
                  onClick={() => uiState.mobileOpen = !uiState.mobileOpen}
                >
                  ☰
                </button>
                <Heading level={5}>Pounce Docs</Heading>
                <Toolbar.Spacer />
                <ThemeToggle settings={envSettings} simple />
              </Toolbar>
            </Container>
          </header>
          <Container tag="main" style="padding: 2rem 0;">
            <Router
              routes={routes}
              notFound={({ url }: { url: string }) => (
                <section style="padding: 2rem 0;">
                  <Heading level={2}>Not found</Heading>
                  <Text>No page at <code>{url}</code>.</Text>
                </section>
              )}
            />
          </Container>
        </div>
      </div>
    </Env>
  )
}

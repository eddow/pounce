import { A } from '@pounce/kit'
import { Code, Section } from '../../components'

const viteConfig = `import { defineConfig } from 'vite'
import { pounceCorePackage } from '@pounce/core/plugin'

export default defineConfig({
  plugins: [
    ...pounceCorePackage({
      core: {
        jsxRuntime: {
          runtime: 'automatic',
          importSource: '@pounce/core',
        },
      },
    }),
  ],
})`

const tsconfig = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@pounce/core",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}`

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Pounce App</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`

const mainTsx = `import { bindApp } from '@pounce/core'
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'

setAdapter(picoAdapter)

function App() {
  return (
    <main class="container">
      <h1>Hello Pounce!</h1>
      <p>Your first pounce application is running.</p>
    </main>
  )
}

bindApp(<App />, '#app')`

export default function GettingStartedPage() {
  return (
    <article>
      <h1>Getting Started</h1>
      <p>Set up a new Pounce application from scratch.</p>

      <Section title="Installation">
        <p>Create a new project and install the core packages:</p>
        <Code code={`mkdir my-app && cd my-app
pnpm init
pnpm add @pounce/core @pounce/kit @pounce/ui @pounce/adapter-pico @picocss/pico mutts
pnpm add -D vite typescript sass`} lang="bash" />
      </Section>

      <Section title="Vite Configuration">
        <p>
          Pounce uses a Babel plugin to transform JSX and enable two-way binding.
          The plugin is bundled with <code>@pounce/core/plugin</code>.
        </p>
        <Code code={viteConfig} lang="typescript" />
      </Section>

      <Section title="TypeScript Configuration">
        <Code code={tsconfig} lang="json" />
      </Section>

      <Section title="HTML Entry Point">
        <Code code={indexHtml} lang="html" />
      </Section>

      <Section title="Your First Component">
        <p>Create <code>src/main.tsx</code>:</p>
        <Code code={mainTsx} lang="tsx" />
        <p>Run <code>pnpm vite</code> and open the browser.</p>
      </Section>

      <Section title="Next Steps">
        <ul>
          <li><A href="/getting-started/concepts">Core Concepts</A> — scope, reactivity, components, directives</li>
          <li><A href="/core">@pounce/core</A> — JSX factory, PounceElement, reconciler</li>
          <li><A href="/ui">@pounce/ui</A> — component library with adapter pattern</li>
        </ul>
      </Section>
    </article>
  )
}

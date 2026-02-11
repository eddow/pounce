import { Section, Code, ApiTable } from '../../components'

const basicUsage = `import { ErrorBoundary } from '@pounce/ui'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>`

const customFallback = `<ErrorBoundary
  fallback={(error) => <div>Custom error: {error.message}</div>}
  onError={(error) => logToService(error)}
>
  <YourComponent />
</ErrorBoundary>`

const productionUsage = `import { ProductionErrorBoundary } from '@pounce/ui'

// Minimal fallback for production — no error details exposed.
<ProductionErrorBoundary>
  <App />
</ProductionErrorBoundary>`

const architecture = `// Architecture: ErrorBoundary uses an inner ErrorReceiver
// component that registers \`caught()\` to intercept errors
// from child rendering and effects. When an error is caught,
// shared reactive state triggers a fallback render.
//
// ⚠️ LIMITATIONS:
// - Does NOT catch async errors in Promises (use .catch())
// - Does NOT catch errors in event handlers (use try-catch)`

export default function ErrorBoundaryPage() {
  return (
    <article>
      <h1>ErrorBoundary</h1>
      <p>
        Catches and displays errors in component trees.
        Uses <code>caught()</code> from mutts to intercept errors from child rendering and effects.
      </p>

      <Section title="Basic Usage">
        <p>Wrap any subtree to catch rendering errors with a default fallback.</p>
        <Code code={basicUsage} lang="tsx" />
      </Section>

      <Section title="Custom Fallback">
        <p>
          Provide a <code>fallback</code> function to render a custom error UI.
          Use <code>onError</code> for side effects like logging.
        </p>
        <Code code={customFallback} lang="tsx" />
      </Section>

      <Section title="ProductionErrorBoundary">
        <p>
          A simpler variant with a minimal, user-friendly fallback that hides error details.
        </p>
        <Code code={productionUsage} lang="tsx" />
      </Section>

      <Section title="Architecture">
        <Code code={architecture} lang="tsx" />
      </Section>

      <Section title="API Reference">
        <h4>ErrorBoundaryProps</h4>
        <ApiTable props={[
          { name: 'children', type: 'JSX.Element | JSX.Element[]', description: 'Component tree to protect', required: true },
          { name: 'fallback', type: '(error: Error, errorInfo: { componentStack: string }) => JSX.Element', description: 'Custom error UI renderer. Receives the caught error', required: false },
          { name: 'onError', type: '(error: Error, errorInfo: { componentStack: string }) => void', description: 'Side-effect callback when an error is caught (e.g. logging)', required: false },
        ]} />
        <h4>ProductionErrorBoundary</h4>
        <ApiTable props={[
          { name: 'children', type: 'JSX.Element | JSX.Element[]', description: 'Component tree to protect', required: true },
        ]} />
      </Section>
    </article>
  )
}

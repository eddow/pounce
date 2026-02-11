import { A } from '@pounce/kit'

export default function PageNav() {
  return (
    <ul>
      <li><A href="/">Home</A></li>
      <li>
        <strong>Getting Started</strong>
        <ul>
          <li><A href="/getting-started">Installation</A></li>
          <li><A href="/getting-started/concepts">Concepts</A></li>
        </ul>
      </li>
      <li>
        <strong>@pounce/core</strong>
        <ul>
          <li><A href="/core">Overview</A></li>
          <li><A href="/core/jsx">JSX Factory</A></li>
          <li><A href="/core/components">Components</A></li>
          <li><A href="/core/directives">Directives</A></li>
          <li><A href="/core/scope">Scope</A></li>
          <li><A href="/core/compose">Compose</A></li>
          <li><A href="/core/ssr">SSR</A></li>
        </ul>
      </li>
      <li>
        <strong>@pounce/kit</strong>
        <ul>
          <li><A href="/kit">Overview</A></li>
          <li><A href="/kit/router">Router</A></li>
          <li><A href="/kit/client">Client State</A></li>
          <li><A href="/kit/intl">Intl</A></li>
          <li><A href="/kit/storage">Storage</A></li>
          <li><A href="/kit/css">CSS Utilities</A></li>
        </ul>
      </li>
      <li>
        <strong>@pounce/ui</strong>
        <ul>
          <li><A href="/ui">Overview</A></li>
          <li><A href="/ui/button">Button</A></li>
          <li><A href="/ui/accordion">Accordion</A></li>
          <li><A href="/ui/card">Card</A></li>
          <li><A href="/ui/forms">Forms</A></li>
          <li><A href="/ui/overlays">Overlays</A></li>
          <li><A href="/ui/layout">Layout</A></li>
          <li><A href="/ui/progress">Progress</A></li>
          <li><A href="/ui/status">Status</A></li>
          <li><A href="/ui/stars">Stars</A></li>
          <li><A href="/ui/error-boundary">ErrorBoundary</A></li>
          <li><A href="/ui/menu">Menu</A></li>
          <li><A href="/ui/adapter">Adapter</A></li>
        </ul>
      </li>
    </ul>
  )
}

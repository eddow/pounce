# Pounce

> A lightweight, reactive web framework ecosystem built with TypeScript and JSX

Pounce is a monorepo containing a collection of packages for building modern web applications with automatic reactivity, type safety, and minimal overhead.

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`@pounce/core`](./packages/core) | Lightweight reactive UI framework with JSX | Stable |
| [`@pounce/board`](./packages/board) | Full-stack meta-framework with SSR and file-based routing | In Development |
| [`@pounce/pico`](./packages/pico) | UI components built on PicoCSS | Stable |
| [`@pounce/toolbox`](./packages/toolbox) | Client utilities, routing, and API helpers | In Development |

## 🌟 Features

- **🚀 Lightweight**: No virtual DOM, minimal overhead
- **⚡ Reactive**: Automatic reactivity powered by `mutts` reactivity engine
- **🔄 Two-Way Binding**: Automatic detection and setup of two-way data binding
- **🎨 JSX Support**: Write components using familiar JSX syntax
- **💪 Type-Safe**: Full TypeScript support with type safety
- **🧩 Component-Based**: Create reusable, composable components
- **📦 No Runtime Overhead**: Works directly with the DOM
- **🗂️ File-Based Routing** (Board): Automatic route generation from file structure
- **🔄 SSR-First** (Board): Server-side rendering with hydration
- **🛠️ Client Utilities** (Toolbox): Browser APIs, routing, and helpers

## Quick Start

```bash
# Install core package
npm install @pounce/core mutts

# Or install the full-stack framework
npm install @pounce/board
```

## Example

```tsx
import { reactive } from 'mutts'
import { bindApp } from '@pounce/core'

function Counter() {
  const state = reactive({ count: 0 })
  
  return (
    <>
      <h1>Counter: {state.count}</h1>
      <button onClick={() => state.count++}>Increment</button>
    </>
  )
}

bindApp(() => <Counter />, '#app')
```

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Run linting
pnpm run lint
```

## Documentation

- **[@pounce/core](./packages/core)** - Core reactive framework documentation
- **[@pounce/board](./packages/board)** - Full-stack framework documentation
- **[@pounce/pico](./packages/pico)** - UI components documentation
- **[@pounce/toolbox](./packages/toolbox)** - Client utilities and routing documentation

## License

MIT

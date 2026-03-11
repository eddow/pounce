# Pounce

> A lightweight, reactive web framework ecosystem built with TypeScript and JSX

Pounce is a monorepo containing a collection of packages for building modern web applications with automatic reactivity, type safety, and minimal overhead.

## Ecosystem Status

- **[@pounce/core](./packages/core)**: The foundational reactive UI framework with JSX. It is **mostly done** and stable.
- **[@pounce/kit](./packages/kit)** & **[@pounce/ui](./packages/ui)**: Client utilities, routing, and UI components. These are **quite finished** and work seamlessly with their **[pico adapter](./packages/adapters/pico)**.
- **[@pounce/board](./packages/board)**: The full-stack meta-framework. It is currently undergoing a **complete rework** from the ground up and is not ready for general use at this time.

## 🌟 Features

- **🚀 Lightweight**: No virtual DOM, minimal overhead
- **⚡ Reactive**: Automatic reactivity powered by `mutts` reactivity engine
- **🔄 Two-Way Binding**: Automatic detection and setup of two-way data binding
- **🎨 JSX Support**: Write components using familiar JSX syntax
- **💪 Type-Safe**: Full TypeScript support with type safety
- **🧩 Component-Based**: Create reusable, composable components
- **📦 No Runtime Overhead**: Works directly with the DOM

## Quick Start

```bash
# Install core package
npm install @pounce/core mutts

# Install Kit, UI, and Pico adapter
npm install @pounce/kit @pounce/ui @pounce/adapter-pico
```

## Example

```tsx
import { reactive } from 'mutts'
import { latch } from '@pounce/core'

function Counter() {
  const state = reactive({ count: 0 })
  
  return (
    <>
      <h1>Counter: {state.count}</h1>
      <button onClick={() => state.count++}>Increment</button>
    </>
  )
}

latch('#app', () => <Counter />)
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
- **[@pounce/kit](./packages/kit)** - Client utilities and routing documentation
- **[@pounce/ui](./packages/ui)** - UI components documentation

## AI

For documentation-aware MCP workflows around Pounce, you can use **[`soup-chop`](https://www.npmjs.com/package/soup-chop)** as a documentation MCP.

## License

MIT

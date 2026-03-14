# Sursaut-TS

> A lightweight, reactive web framework built with TypeScript and JSX

Sursaut-TS is a fine-grained reactive UI framework built on direct DOM updates and `mutts`. Components render once, then reactive attributes, directives, and effects keep the DOM in sync without component re-renders.

## 🌟 Features

- **🚀 Lightweight**: No virtual DOM, minimal overhead
- **⚡ Reactive**: Fine-grained reactivity powered by `mutts`
- **🔄 Two-Way Binding**: Automatic detection and setup of two-way data binding
- **🎨 JSX Support**: Write components using familiar JSX syntax
- **💪 Type-Safe**: Full TypeScript support with type safety
- **🧩 Component-Based**: Create reusable, composable components
- **🧭 Render-once model**: Reactive reads belong in JSX, directives, and effects rather than component rebuilds

## 📖 Documentation

Live documentation is available at **https://sursaut-docs-front.pages.dev/**.

For the `@sursaut/core` entry point specifically, start at:

- **https://sursaut-docs-front.pages.dev/core**
- **https://sursaut-docs-front.pages.dev/getting-started**

Complete documentation is available in the [docs folder](docs):

- **[Getting Started](docs/getting-started.md)** - Introduction and quick start guide
- **[Components](docs/components.md)** - Building and using components
- **[Reactivity](docs/reactivity.md)** - Understanding reactive state and effects
- **[Two-Way Binding](docs/binding.md)** - Form inputs and data binding
- **[Advanced Features](docs/advanced.md)** - Conditional rendering, scopes, and more
- **[API Reference](docs/api-reference.md)** - Complete API documentation
- **[Examples](docs/examples.md)** - Complete working examples

`@sursaut/core` is built on top of **[`mutts`](https://www.npmjs.com/package/mutts)** for reactivity. For documentation-oriented reading and MCP-assisted exploration of the package surface, see **[`soup-chop`](https://www.npmjs.com/package/soup-chop)**.

## 🚀 Quick Start

### Installation

```bash
npm install @sursaut/core mutts
```

### TypeScript Configuration

Sursaut uses the **classic JSX transform**. In your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

Do **not** use `jsx: "react-jsx"` or `jsxImportSource` with `@sursaut/core`.

### Vite / Babel Configuration

Sursaut ships a plugin at `@sursaut/core/plugin`. Use it to apply the JSX/Babel transform that injects `h`, `Fragment`, `c`, and `r` where needed.

See the consuming app/package configs in this workspace for concrete setup examples. The key rule is: **classic JSX in TypeScript, Sursaut plugin in the build step**.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## 💡 Example

Here's a simple counter component:

```tsx
import { reactive } from 'mutts'
import { latch } from '@sursaut/core'

function Counter() {
  const state = reactive({ count: 0 })

  return (
    <>
      <h1>Counter: {state.count}</h1>
      <button onClick={() => state.count++}>Increment</button>
      <button onClick={() => state.count--}>Decrement</button>
    </>
  )
}

latch('#app', <Counter />)
```

## 🎯 Key Concepts

### Components

Components are TypeScript functions that return JSX. They are expected to **render once**; subsequent updates happen through fine-grained reactive bindings.

### Reactive State

Use `reactive()` to create reactive state:

```tsx
const state = reactive({
  count: 0,
  message: 'Hello World'
})
```

### Two-Way Binding

Bindable expressions such as `state.name` or a mutable `let` variable become two-way automatically:

```tsx
<input value={state.name} />
```

### Event Handlers

Use camelCase event handlers:

```tsx
<button onClick={() => state.count++}>Click me</button>
```

### Directives

Sursaut extends JSX with framework directives:

```tsx
<div if={state.visible} />
<input this={setInput} />
<div use={(node) => console.log(node)} />
<div use:resize={state.size} />
```

- `if`, `when`, `else`, `pick` control rendering
- `this` tracks mounted nodes and receives `undefined` on unlatch
- `use` and `use:name` support cleanup functions

## 📚 Learn More

- Visit the live docs at **https://sursaut-docs-front.pages.dev/core**
- Read about the reactive foundation in **[`mutts`](https://www.npmjs.com/package/mutts)**
- Use **[`soup-chop`](https://www.npmjs.com/package/soup-chop)** to explore package docs and API references with MCP
- Read the [Getting Started Guide](docs/getting-started.md)
- Explore [Components](docs/components.md)
- Understand [Reactivity](docs/reactivity.md)
- Master [Two-Way Binding](docs/binding.md)
- Check out [Advanced Features](docs/advanced.md)
- Browse the [API Reference](docs/api-reference.md)
- See [Examples](docs/examples.md)

## 🛠️ Tech Stack

- **TypeScript** - Type safety and modern JavaScript
- **JSX** - Familiar component syntax
- **mutts** - Reactive state management
- **Vite** - Fast development and build tool
- **@sursaut/core/plugin** - Build-time JSX transformation and reactive enhancements

## 📝 License

MIT
# Pounce-TS

> A lightweight, reactive web framework built with TypeScript and JSX

Pounce-TS is a fine-grained reactive UI framework built on direct DOM updates and `mutts`. Components render once, then reactive attributes, directives, and effects keep the DOM in sync without component re-renders.

## 🌟 Features

- **🚀 Lightweight**: No virtual DOM, minimal overhead
- **⚡ Reactive**: Fine-grained reactivity powered by `mutts`
- **🔄 Two-Way Binding**: Automatic detection and setup of two-way data binding
- **🎨 JSX Support**: Write components using familiar JSX syntax
- **💪 Type-Safe**: Full TypeScript support with type safety
- **🧩 Component-Based**: Create reusable, composable components
- **🧭 Render-once model**: Reactive reads belong in JSX, directives, and effects rather than component rebuilds

## 📖 Documentation

Complete documentation is available in the [docs folder](docs):

- **[Getting Started](docs/getting-started.md)** - Introduction and quick start guide
- **[Components](docs/components.md)** - Building and using components
- **[Reactivity](docs/reactivity.md)** - Understanding reactive state and effects
- **[Two-Way Binding](docs/binding.md)** - Form inputs and data binding
- **[Advanced Features](docs/advanced.md)** - Conditional rendering, scopes, and more
- **[API Reference](docs/api-reference.md)** - Complete API documentation
- **[Examples](docs/examples.md)** - Complete working examples

## 🚀 Quick Start

### Installation

```bash
npm install @pounce/core mutts
```

### TypeScript Configuration

Pounce uses the **classic JSX transform**. In your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

Do **not** use `jsx: "react-jsx"` or `jsxImportSource` with `@pounce/core`.

### Vite / Babel Configuration

Pounce ships a plugin at `@pounce/core/plugin`. Use it to apply the JSX/Babel transform that injects `h`, `Fragment`, `c`, and `r` where needed.

See the consuming app/package configs in this workspace for concrete setup examples. The key rule is: **classic JSX in TypeScript, Pounce plugin in the build step**.

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
import { latch } from '@pounce/core'

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

Pounce extends JSX with framework directives:

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
- **@pounce/core/plugin** - Build-time JSX transformation and reactive enhancements

## 📝 License

MIT
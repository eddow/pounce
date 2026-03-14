# Getting Started with Sursaut-TS

Sursaut-TS is a fine-grained reactive web framework built with TypeScript, JSX, and `mutts`. Components render once, then reactive bindings keep the DOM updated without component rebuilds.

## Features

- 🚀 **Lightweight**: Minimal overhead, no virtual DOM
- ⚡ **Reactive**: Fine-grained reactivity with `mutts`
- 🔄 **Two-Way Binding**: Automatic detection and setup of two-way data binding
- 🎨 **JSX Support**: Write components using familiar JSX syntax
- 💪 **Type-Safe**: Full TypeScript support with type safety
- 🧩 **Component-Based**: Create reusable, composable components
- 🎯 **Render-once components**: Reactivity lives in JSX, directives, and effects

## Installation

### Prerequisites

- Node.js (v18 or higher)

### Setup

1. Clone the repository or create a new project:

```bash
npm init -y
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Quick Start

### Your First App

Create a file `src/app.tsx`:

```tsx
import { reactive } from 'mutts'
import { latch } from '@sursaut/core'

// Create reactive state
const state = reactive({
  count: 0,
  message: 'Hello Sursaut!'
})

// Define your app component
function MyApp() {
  return (
    <>
      <h1>{state.message}</h1>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>Increment</button>
      <button onClick={() => state.count--}>Decrement</button>
    </>
  )
}

// Mount into the DOM
latch('#app', <MyApp />)
```

Create an HTML file with a container:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Sursaut App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/app.tsx"></script>
</body>
</html>
```

That's it! Your reactive app is ready.

## Core Concepts

### 1. Components

Components are TypeScript functions that return JSX:

```tsx
function Greeting(props: { name: string }) {
  return <h1>Hello, {props.name}!</h1>
}
```

### 2. Reactive State

Use `reactive()` from `mutts` to create reactive state:

```tsx
import { reactive } from 'mutts'

const state = reactive({
  count: 0,
  items: []
})
```

### 3. Event Handlers

Use camelCase event handlers (e.g., `onClick`, `onInput`):

```tsx
<button onClick={() => state.count++}>
  Click me
</button>
```

### 4. Two-Way Binding

The Babel plugin auto-generates `{ get, set }` pairs for member expressions and mutable (`let`/`var`) identifiers. `const` and imports stay one-way.

```tsx
// Member expression → two-way
<input value={state.name} />

// Mutable variable → two-way
let count = 0
<Counter value={count} />

// Or explicitly with update:
<input 
  value={state.age} 
  update:value={(v) => state.age = v}
/>
```

## Next Steps

- Learn about [Components](./components.md)
- Understand [Reactive State](./reactivity.md)
- Explore [Two-Way Binding](./binding.md)
- See [Advanced Features](./advanced.md)
- Check out [Examples](./examples.md)



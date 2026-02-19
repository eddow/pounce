# Two-Way Binding in Pounce-TS

Pounce-TS provides automatic two-way binding for form inputs and component properties. The Babel plugin automatically detects when you're binding to an assignable expression and sets up the binding for you.

## Automatic Two-Way Binding

The plugin generates a `{ get, set }` pair (two-way binding) when the attribute value is:

- A **member expression** — `state.name`, `props.count`, `obj['key']`
- A **mutable bare identifier** — a `let` or `var` variable

It generates **one-way** (read-only) binding when the value is:

- A **`const`** variable, an **import**, a **function declaration**, or a **parameter**
- A **literal**, **function expression**, or other safe expression (no wrapping at all)
- A **complex expression** like a function call or template literal (wrapped in `r(() => expr)`)

### Basic Usage

```tsx
const state = reactive({ name: 'Alice' })

// Member expression → two-way
<input value={state.name} />

// Mutable variable → two-way
let count = 0
<Counter value={count} />

// Const → one-way (safe, no wrapping)
const label = 'Hello'
<Greeting name={label} />
```

The Babel plugin automatically transforms assignable expressions into two-way bindings:

```tsx
// What you write
<input value={state.name} />

// What it becomes (conceptual)
<input value={{
  get: () => state.name,
  set: (val) => state.name = val
}} />
```

### Input Types

Different input types are handled automatically:

```tsx
const state = reactive({
  text: '',
  number: 0,
  checked: false,
  date: '2024-01-01'
})

// Text input
<input type="text" value={state.text} />

// Number input
<input type="number" value={state.number} />
<input type="range" min={0} max={100} value={state.number} />

// Checkbox
<input type="checkbox" checked={state.checked} />

// Date input
<input type="date" value={state.date} />
```

## Explicit Update Syntax

For more control, use the `update:prop` syntax:

```tsx
const state = reactive({ age: 25 })

<input 
  value={state.age} 
  update:value={(v) => state.age = Number(v)} 
/>
```

This is useful when you need to:
- Transform the value before storing
- Validate the input
- Handle edge cases

### Custom Transformation

```tsx
const state = reactive({ price: 0 })

<input 
  value={state.price} 
  update:value={(v) => {
    const num = parseFloat(v)
    state.price = isNaN(num) ? 0 : Math.max(0, num)
  }} 
/>
```

## One-Way Binding

Values that cannot be assigned to are automatically one-way:

```tsx
// const variable → safe, no wrapping
const label = 'Hello'
<Greeting name={label} />

// Memoized value → reactive one-way (wrapped in r())
const displayName = memoize(() => state.name.toUpperCase())
<input value={displayName()} />

// Complex expression → reactive one-way
<span title={state.firstName + ' ' + state.lastName} />
```

## Component Props

### Binding Props to Components

Pass reactive values to component props:

```tsx
function Counter(props: { count: number }) {
  return <p>Count: {props.count}</p>
}

const state = reactive({ count: 0 })

// Two-way binding (member expression)
<Counter count={state.count} />

// Two-way binding (mutable variable)
let count = 0
<Counter count={count} />

// One-way binding (const → safe, no wrapping)
const doubled = memoize(() => state.count * 2)
<Counter count={doubled} />
```

### Updating Parent State from Child

The child component can update the prop value:

```tsx
function IncrementableCounter(props: { count: number }) {
  function increment() {
    props.count = props.count + 1  // Updates parent state
  }
  
  return (
    <div>
      <p>Count: {props.count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  )
}
```

## Event-Based Updates

For more complex scenarios, use event handlers:

```tsx
function TodoInput(props: { onSubmit: (text: string) => void }) {
  const state = reactive({ text: '' })
  
  return (
    <div>
      <input 
        value={state.text}
        onInput={(e) => state.text = e.target.value}
        onKeypress={(e) => e.key === 'Enter' && props.onSubmit(state.text)}
      />
      <button onClick={() => props.onSubmit(state.text)}>
        Submit
      </button>
    </div>
  )
}
```

## Props with Getters and Setters

For advanced scenarios, you can use get/set objects:

```tsx
const state = reactive({ value: 'test' })

const binding = {
  get: () => state.value,
  set: (val: string) => {
    // Custom logic
    console.log('Setting value to:', val)
    state.value = val
  }
}

<input value={binding} />
```

## Array Manipulation

Pounce-TS provides utilities for reactive array operations:

```tsx
import { array } from '../lib/utils'

const todos = reactive([
  { id: 1, text: 'Task 1' },
  { id: 2, text: 'Task 2' }
])

// Remove item
array.remove(todos, todo)

// Filter items
array.filter(todos, todo => !todo.completed)

// Compute array
const active = array.computed(() => 
  todos.filter(t => !t.completed)
)
```

## Binding Between Components

### Parent-Child Binding

```tsx
function App() {
  const state = reactive({ user: { name: 'Alice', age: 30 } })
  
  return (
    <div>
      <UserForm user={state.user} />
      <UserDisplay user={state.user} />
    </div>
  )
}

function UserForm(props: { user: { name: string; age: number } }) {
  return (
    <div>
      <input value={props.user.name} placeholder="Name" />
      <input type="number" value={props.user.age} placeholder="Age" />
    </div>
  )
}

function UserDisplay(props: { user: { name: string; age: number } }) {
  return (
    <div>
      <p>Name: {props.user.name}</p>
      <p>Age: {props.user.age}</p>
    </div>
  )
}
```

### Sibling Component Binding

Bind siblings through a common parent:

```tsx
function App() {
  const state = reactive({ searchTerm: '' })
  
  return (
    <div>
      <SearchInput value={state.searchTerm} />
      <SearchResults term={state.searchTerm} />
    </div>
  )
}
```

## Best Practices

1. **Use automatic binding**: Let the framework handle simple cases
2. **Use update:prop for validation**: Add custom logic when needed
3. **Keep state normalized**: Store data in a single source of truth
4. **Use computed for derived values**: Don't duplicate reactive data
5. **Handle edge cases**: Always validate input when using update

## Common Patterns

### Input with Validation

```tsx
function ValidatedInput() {
  const state = reactive({ 
    value: '',
    error: ''
  })
  
  return (
    <div>
      <input 
        value={state.value}
        update:value={(v) => {
          state.value = v
          state.error = v.length < 3 ? 'Too short' : ''
        }}
      />
      {state.error && <span style="color: red">{state.error}</span>}
    </div>
  )
}
```

### Debounced Input

```tsx
import { effect, watch } from 'mutts'

function DebouncedSearch() {
  const state = reactive({ 
    input: '',
    searchTerm: ''
  })
  
  let timeout: number
  watch(() => state.input, (value) => {
    clearTimeout(timeout)
    timeout = window.setTimeout(() => {
      state.searchTerm = value
    }, 300)
  })
  
  return (
    <div>
      <input value={state.input} />
      <p>Searching for: {state.searchTerm}</p>
    </div>
  )
}
```



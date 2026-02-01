# Component Reactivity Rules

## 🚫 Important: Components Should Never Re-render

In Pounce, components follow a **render-once** philosophy. A component function should execute exactly once during mounting, and never again. Any reactive behavior should be handled through effects, not through re-rendering.

## Why This Matters

Traditional frameworks like React re-render entire component trees when state changes. Pounce takes a different approach:

1. **Render Once**: Components render once and create a DOM structure
2. **Reactive Updates**: Individual parts of the DOM update through fine-grained reactivity
3. **Effects for Logic**: Any reactive logic should be wrapped in `effect(() => ...)`

## Common Traps to Avoid

### ❌ Wrong: Creating Reactive Dependencies During Render

```typescript
// BAD: This creates reactive dependencies during render
export function BadComponent(props: { count: number }) {
  // This will cause the component to re-render when count changes
  const doubled = props.count * 2
  
  return <div>{doubled}</div>
}
```

### ✅ Correct: Using Effects for Reactivity

```typescript
import { effect } from 'mutts'

export function GoodComponent(props: { count: number }) {
  // Component renders once with initial value
  const countElement = <div>0</div>
  
  // Use effect to handle reactive updates
  effect(() => {
    countElement.textContent = String(props.count * 2)
  })
  
  return countElement
}
```

## Error Messages

If you accidentally create reactive dependencies during component rendering, you'll see:

```
Error: Component rendering detected reactive changes. Components should render only once.
See: https://github.com/eddow/pounce/tree/master/packages/core/docs/component-reactivity.md

To fix this:
1. Move reactive logic into effect(() => ...)
2. Use untracked() for non-reactive computations
3. Ensure component functions don't depend on changing state
```

## Best Practices

### 1. Separate Rendering from Logic

```typescript
export function Component(props: Props, scope: Scope) {
  // ✅ Rendering: happens once
  const element = (
    <div class="container">
      <span class="title">Loading...</span>
      <span class="value">0</span>
    </div>
  )
  
  // ✅ Logic: handles reactivity
  effect(() => {
    const titleElement = element.querySelector('.title')
    const valueElement = element.querySelector('.value')
    
    titleElement.textContent = props.title
    valueElement.textContent = String(props.value)
  })
  
  return element
}
```

### 2. Use untracked() for Non-Reactive Computations

```typescript
import { untracked } from 'mutts'

export function Component(props: Props) {
  // ✅ Non-reactive computation
  const staticValue = untracked(() => {
    return expensiveCalculation(props.staticData)
  })
  
  return <div>{staticValue}</div>
}
```

### 3. Reactive Props Should Be Bound Directly

```typescript
export function InputComponent(props: { value: string }) {
  // ✅ Direct binding creates two-way reactivity
  return <input value={props.value} />
}
```

## Testing Components

When testing components, ensure they render without triggering reactive errors:

```typescript
it('should render without reactivity issues', () => {
  const mount = h(MyComponent, { prop: 'value' })
  const root = mount.render(rootScope)
  
  // Component should render once without errors
  expect(root).toBeTruthy()
})
```

## Migration from React

If you're coming from React:

| React Pattern | Pounce Pattern |
|--------------|-----------------|
| `useState` + re-render | Direct state mutation + effect |
| `useEffect` for side effects | `effect(() => ...)` |
| Conditional rendering with `&&` | JSX `if` directive |
| `array.map()` for lists | `project()` from mutts |

## Remember

- **Components render once**
- **Effects handle reactivity**  
- **DOM updates are fine-grained**
- **No re-rendering allowed**

This approach ensures optimal performance and predictable behavior in Pounce applications.

# Pounce Recipes & Best Practices

This guide covers common patterns for handling derived state and computed properties in Pounce/Mutts, focusing on how to avoid the "Body Access Hazard".

## The "Body Access Hazard"

In Pounce, component functions run **once** during the initial render. They set up the reactive graph (effects, bindings) but do not re-run themselves on every update.

**The Hazard:** Accessing a reactive property (like `props.count` or `state.value`) directly in the component body (outside an effect or computed) creates a dependency for the *entire component initialization*. If that property changes, the component attempts to re-run, which is inefficient and often incorrect for fine-grained reactivity.

### ❌ Anti-Pattern: Direct Body Access
```typescript
function Counter(props) {
  // BAD: Reading props.count here makes the component depend on 'count'.
  // Every time count changes, the component function re-runs!
  const double = props.count * 2; 

  return <div>{double}</div>;
}
```

### ✅ Pattern: Lazy Computed (Lightweight)
For simple derivations that are cheap to calculate, use a getter object. The calculation happens only when the *binding* (in the JSX) reads the value.

```typescript
function Counter(props) {
  // GOOD: The getter delays execution until render-time or effect-time.
  // The component function itself has NO dependency on props.count.
  const computed = {
    get double() { return props.count * 2 }
  };

  // The binding `{computed.double}` creates the effect that tracks 'count'.
  return <div>{computed.double}</div>;
}
```

## Advanced Patterns

### 1. Memoized Computed (Caching)
For expensive calculations (e.g., filtering a list) or to ensure stable references, use `memoize`. This caches the result and only re-calculates when dependencies change.

```typescript
import { memoize } from 'mutts';

function TodoList(props) {
  const computed = memoize({
    get activeTodos() {
      console.log('Filtering...'); // Only runs when props.todos chages
      return props.todos.filter(t => !t.completed);
    },
    get count() {
      return this.activeTodos.length;
    }
  });

  return (
    <div>
      <for each={computed.activeTodos}>...</for>
      <footer>{computed.count} items left</footer>
    </div>
  );
}
```
*Note: `this` inside the memoized object refers to the memoized proxy itself, so `this.activeTodos` hits the cache.*

### 2. From React/Angular to Pounce

| Concept | React | Angular (Signals) | Pounce |
| :--- | :--- | :--- | :--- |
| **Component Body** | Re-runs on every render | Constructor (run once) | Run once (setup phase) |
| **Derived State** | `useMemo(() => ...)` | `computed(() => ...)` | `memoize({ get x() ... }).x` |
| **Simple Derived** | `const x = ...` (in body) | `() => ...` (function) | `{ get x() ... }.x` (getter) |
| **Effect** | `useEffect(() => ...)` | `effect(() => ...)` | `effect(() => ...)` |

**Key Takeaway:** Think of the component function as a **constructor** or **setup** function. It defines *what* the component is and *how* it reacts, but it doesn't "render" the output repeatedly. The JSX returns a scene graph that *binds* to your reactive state.

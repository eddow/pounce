# Testing Pounce Applications

Pounce is designed to make testing straightforward. thanks to its isomorphic nature and request isolation, you can write tests using your regular imports without worrying about the underlying environment (DOM vs. Node.js).

---

## 1. Transparency

You don't need special wrappers or "careful handling" to test Pounce components. Simply import your components and the canonical globals (`document`, `window`, etc.) directly from `@pounce/core`:

```tsx
import { latch, document } from '@pounce/core'
import { MyComponent } from './MyComponent'

// It just works
```

---

## 2. Component Testing (Vitest)

Most tests will be component tests. These verify that your UI looks and behaves correctly.

### Environment Setup (Optional)

While you *can* configure Vitest to use the `jsdom` environment in `vitest.config.ts`, it is **purely optional**. 

If Pounce detects it's running in a test environment (`process.env.NODE_ENV === 'test'`) but no global `window` is provided, it automatically initializes its own JSDOM instance.

```typescript
// vitest.config.ts (Optional)
export default defineConfig({
  test: {
    // environment: 'jsdom', // Pounce handles this if omitted!
  }
})
```

### Writing a Test

Use `latch` to mount components. Always clean up in `afterEach` to keep your environment pristine.

```tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@pounce/core'
import { Button } from './Button'

describe('Button', () => {
  let container: HTMLElement
  let unmount: (() => void) | undefined

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    unmount?.()
    container.remove()
  })

  it('renders children', () => {
    unmount = latch(container, <Button>Click Me</Button>)
    expect(container.textContent).toBe('Click Me')
  })
})
```

---

## 3. Environment Debugging (`entryPoint`)

If you are unsure which environment Pounce has initialized, you can import the `entryPoint` string. This is particularly useful when debugging VSCode extension behavior or complex SSR setups.

```typescript
import { entryPoint } from '@pounce/core'

console.log(entryPoint) 
// Potential values:
// - 'Vitest/DOM': Running in Vitest with a pre-provided JSDOM (native Vitest setup)
// - 'Vitest/Node': Running in Vitest, but Pounce had to spin up its own JSDOM (e.g. VSCode)
// - 'Node/SSR': Running in a pure Node environment with ALS request isolation
```

---

## 4. SSR Testing (`withSSR`)

When testing server-side rendering or logic that specifically requires request isolation, use the `withSSR` helper from the server entry point.

```typescript
import { renderToString } from '@pounce/core/server'

it('renders as a string', () => {
  const html = renderToString(<MyComponent />)
  expect(html).toContain('<div id="root">')
})
```

---

## 5. Coverage

We recommend using the `v8` provider for coverage, as it provides accurate results for both DOM and Node-based logic in Pounce.

```typescript
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
  },
}
```

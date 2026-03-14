# Testing Sursaut Applications

Sursaut is designed to make testing straightforward. Thanks to its DOM/test bootstrap and separate node entrypoint, you can write component tests and SSR tests without hand-rolling platform setup.

---

## 1. Transparency

You don't need special wrappers or "careful handling" to test Sursaut components. Simply import your components and the canonical globals (`document`, `window`, etc.) directly from `@sursaut/core`:

```tsx
import { latch, document } from '@sursaut/core'
import { MyComponent } from './MyComponent'

// It just works
```

---

## 2. Component Testing (Vitest)

Most tests will be component tests. These verify that your UI looks and behaves correctly.

### Environment Setup (Optional)

While you *can* configure Vitest to use the `jsdom` environment in `vitest.config.ts`, it is **optional**. 

If Sursaut detects it's running in a test environment but no global `window` is provided, the node entrypoint initializes its own JSDOM instance.

```typescript
// vitest.config.ts (Optional)
export default defineConfig({
  test: {
    // environment: 'jsdom', // Sursaut handles this if omitted!
  }
})
```

### Writing a Test

Use `latch` to mount components. Always clean up in `afterEach` to keep your environment pristine.

```tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document } from '@sursaut/core'
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

If you are unsure which environment Sursaut has initialized, you can import the `entryPoint` string. This is particularly useful when debugging VSCode extension behavior or complex SSR setups.

```typescript
import { entryPoint } from '@sursaut/core'

console.log(entryPoint) 
// Potential values:
// - 'Vitest/DOM': Running in Vitest with a pre-provided JSDOM (native Vitest setup)
// - 'Vitest/Node': Running in Vitest, but Sursaut had to spin up its own JSDOM (e.g. VSCode)
```

---

## 4. SSR Testing (`@sursaut/core/node`)

When testing server-side rendering or logic that specifically requires request isolation, import from the node entrypoint.

```typescript
import { renderToString, withSSR } from '@sursaut/core/node'

it('renders as a string', () => {
  const html = renderToString(<MyComponent />)
  expect(html).toContain('My Component')
})

it('runs request-local DOM code', () => {
  withSSR(({ document }) => {
    expect(document.getElementById('root')).toBeTruthy()
  })
})
```

---

## 5. Coverage

We recommend using the `v8` provider for coverage, as it provides accurate results for both DOM and Node-based logic in Sursaut.

```typescript
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
  },
}
```

# ALS-Export Pattern

The **ALS-Export** pattern provides isomorphic, thread-safe access to environment-dependent globals (like `document`, `window`, etc.) through direct, flat exports.

It leverages ESM **Live Bindings** to allow the environment entry points to "enlighten" the shared core with either native globals (Browser) or context-aware proxies (Node/SSR).

## 1. The Vision

Developers should be able to import the full suite of DOM globals (as provided by JSDOM/Browser) as if they were standard library functions:

```typescript
import { document, window, Node, HTMLElement } from '@pounce/core';

const div = document.createElement('div');
const works = myVar instanceof Node;
```

---

## 2. Core Mechanism

The implementation is split into three distinct layers to maintain purity in the shared core.

### Layer A: Shared Contract (`src/shared.ts`)
The shared core defines the data slots. It contains **no environment logic** and **no proxy creation**. It simply holds the reference and the setter.

```typescript
export let document: Document = null!;
export const setDocument = (impl: Document) => { document = impl; };

export let window: Window = null!;
export const setWindow = (impl: Window) => { window = impl; };
```

### Layer B: Browser Entry Point (`src/dom.ts`)
The browser booster binds the native globals directly. This is a one-time assignment during bootstrap.

```typescript
import { setDocument, setWindow } from './shared';

setDocument(window.document);
setWindow(window);
```

### Layer C: Node.js Entry Point (`src/node.ts`)
On the server, the Entry Point binds a **Context Proxy**. This proxy is responsible for resolving the current request context for every operation.

```typescript
import { setDocument, setWindow } from './shared';
import { createAlsProxy } from './node/proxy-factory';

// The proxy object handles the AsyncLocalStorage lookups
setDocument(createAlsProxy<Document>('document'));
setWindow(createAlsProxy<Window>('window'));
```

---

## 3. The Proxy Logic (`src/node/proxy-factory.ts`)

The actual proxy logic resides exclusively in the Node-specific layer. When a property is accessed (e.g., `document.body`), the proxy:
1.  Retrieves the current store from **`AsyncLocalStorage`**.
2.  Finds the targeted object (the specific JSDOM instance for that request).
3.  Forwards the operation.

```typescript
export function createAlsProxy<T>(name: string): T {
  return new Proxy({} as any, {
    get(_, prop) {
      const store = als.getStore(); // AsyncLocalStorage
      const target = store?.get(name);
      
      if (!target) {
        throw new Error(`Accessing ${name}.${String(prop)} outside of a withSSR context.`);
      }
      
      const value = Reflect.get(target, prop);
      // Ensure methods are bound to the target instance (e.g., createElement)
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(_, prop, value) {
      const target = als.getStore()?.get(name);
      return Reflect.set(target, prop, value);
    }
  });
}
```

---

## 4. Advantages

1.  **Shared Core Purity**: `shared.ts` is just a list of variables and setters. It doesn't know about JSDOM, Proxies, or ALS.
2.  **Explicit Binding**: The Entry Point is explicitly responsible for "installing" the platform.
3.  **Concurrency Safety**: Concurrent SSR requests never leak state, as each proxy lookup is localized to the request's ALS store.
4.  **Developer Experience**: The consumer code remains standard DOM code.

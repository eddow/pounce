# Sursaut-Board Architecture

`@sursaut/board` separates routing, HTTP, SSR, and framework integration into distinct layers so the core routing and client behavior stay reusable while Hono wiring remains adapter-specific.

## Directory Structure

```
src/
├── lib/               # Core Logic (Domain & Use Cases)
│   ├── http/          # HTTP abstractions (Request, Response, Proxy)
│   ├── router/        # Routing logic (Trie, Matching, Params)
│   └── ssr/           # Server-Side Rendering utilities
├── adapters/          # Framework Adapters (Infrastructure)
│   └── hono.ts        # Hono integration
├── cli/               # CLI tools
└── index.ts           # Public API
```

## Layers

### 1. Core (`src/lib/`)
The core contains everything needed to define an application without tying it to a specific server runtime.
- **`router/`**: Pure logic for route matching, tree building, and parameter extraction. It knows nothing about Hono or Express.
- **`http/`**:
    - `core.ts`: Types for Requests, Responses, and Middlewares.
    - `client.ts`: Universal `api()` client that works on both server (direct dispatch) and client (fetch/hydration).
    - `proxy.ts`: Logic for defining and using external API proxies.
- **`ssr/`**: Utilities for serializing and injecting data for hydration.

### 2. Adapters (`src/adapters/`)
Adapters glue the core to a specific runtime.
- **`hono.ts`**: Creates the board SSR context, builds the route tree, wires the expose registry, handles API matching, and injects hydration payloads into HTML responses.

### 3. Public API (`src/index.ts`)
Exposes a unified surface area for consumers, re-exporting necessary parts from Lib and Adapters.

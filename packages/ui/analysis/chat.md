# Pounce UI Development Chat

## SSR Context Cleanup

*   **Question**: The collection of styles in a module-level `Map` (instead of `AsyncLocalStorage`) raises concurrency concerns. Is there a formal mechanism (e.g., `clearSSRStyles()`) to ensure that styles collected during one request do not leak into subsequent requests in the same Node.js process?

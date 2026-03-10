# API Reference

## 1. HTTP Client
### `api(input: string | URL | object)`
Creates an API client for a specific path or proxy object.

**Parameters:**
- `input`: URL string with these prefixes:
  - `.` or `..` = Relative to current page
  - `/` = Site-absolute path
  - `http://` or `https://` = Full external URL

**Returns:**
An object with HTTP methods: `get`, `post`, `put`, `delete`, `patch`

**Examples:**
```ts
// URL string patterns
await api("./users").get();                    // Relative to current route
await api("/api/users/123").get();             // Absolute from site root
await api("/api/users").get();                 // Absolute from site root
await api("https://external.com/api").get();   // External URL
```

### Method Signatures
#### `get<T>(params?: Record<string, string>): Promise<T>`
Makes a GET request.

#### `post<T>(body: unknown): Promise<T>`
Makes a POST request.

#### `put<T>(body: unknown): Promise<T>`
Makes a PUT request.

#### `delete<T>(params?: Record<string, string>): Promise<T>`
Makes a DELETE request.

#### `patch<T>(body: unknown): Promise<T>`
Makes a PATCH request.

## 2. SSR Utilities
### `getSSRData<T>(id: string): T | null`
Retrieves data injected during SSR.

**Parameters:**
- `id`: The script tag ID (typically `api-response-{path}`)

**Example:**
```ts
const user = getSSRData<User>("api-response-user-123");
```

### `injectApiResponses(html: string, responses: Record<string, { id: string; data: unknown }>): string`
Injects API responses into HTML during SSR.

## 3. Middleware
### `Middleware` Type
```ts
type Middleware = (
  context: {
    request: Request;
    params: Record<string, string>;
    [key: string]: unknown; // Custom context properties
  },
  next: () => Promise<Response>
) => Promise<Response>;
```

### `runMiddlewares(middlewareStack: Middleware[], context: Omit<MiddlewareContext, 'next'>, handler: () => Promise<Response>): Promise<Response>`
Executes a middleware stack.

## 4. Route Handlers
### Handler Functions
HTTP handlers are declared inside `expose()`:
```ts
import { expose } from '@pounce/board/server'

export default expose({
  get: async ({ params }) => {
    return {
      status: 200,
      data: { id: params.id },
    }
  },
})
```


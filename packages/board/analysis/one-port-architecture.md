# Sursaut Framework: The "One Port" Architecture (Vite + Hono)

## 1. Architectural Overview: The "Flip"

To provide the ultimate developer experience (instant HMR) and the most robust production environment (a single, unified server deployment), Sursaut utilizes a "Flipped" architecture. 

Regardless of the environment, the frontend and backend always run on the exact same port. This eliminates all CORS configurations and `OPTIONS` preflight requests. However, which server acts as the "Front Door" changes depending on the environment.

* **Development:** Vite is the Front Door. Hono runs *inside* Vite.
* **Production:** Hono is the Front Door. Vite is completely removed.

---

## 2. Development Mode: Vite is the Boss

In development, we need Vite to parse the `**/*.tsx` files, inject Hot Module Replacement (HMR) scripts, and serve the UI. 

To achieve "One Port" in development, we use the `@hono/vite-dev-server` plugin. Vite listens on port `5173`. 
1. If a request comes in for a static asset or a `.tsx` file, Vite handles it natively.
2. If a request comes in for the API (e.g., `/api/*` or the Deck Batch Provider `/__sursaut/*`), Vite intercepts it and passes the raw standard Request object directly to your Hono instance.



### The Vite Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import devServer from '@hono/vite-dev-server';

// Assuming your Board Engine's Hono app is exported from this entry file
const entry = 'src/server/entry.ts'; 

export default defineConfig({
  plugins: [
    devServer({
      entry,
      // Tell Vite which routes should bypass the UI and go straight to Hono
      exclude: [
        /.*\.tsx?($|\?)/,
        /.*\.(s?css|less)($|\?)/,
        /.*\.(svg|png)($|\?)/,
        /^\/@.+$/,
        /^\/node_modules\/.*/,
      ],
      injectClientScript: false, // Prevent HMR injection into API JSON responses
    })
  ]
});
```

---

## 3. Production Mode: Hono is the Boss

In production, Vite is not a server; it is merely a build tool. Running `vite build` compiles all `.tsx` UI components, CSS, and static assets into optimized, minified files inside a `dist/` directory.

Once built, Hono becomes the Front Door. You start your Node.js, Bun, or Deno server running Hono on port `3000`.
1. Hono registers all the dynamic API routes compiled by the `expose` Board Engine.
2. For any request that does *not* match an API route, Hono uses a static file middleware to serve the compiled frontend assets from the `dist/` folder.



### The Production Server (`server.production.ts`)

```typescript
import { Hono } from 'hono';
import { serve } from '@hono/node-server'; // Or Bun/Cloudflare adapter
import { serveStatic } from '@hono/node-server/serve-static';
import { engine } from './board-engine'; // Your custom expose parser

const app = new Hono();

// 1. Register all Sursaut API routes and the Batch Provider
app.route('/api', engine.apiRouter);
app.post('/__sursaut/batch-provide', engine.batchProvider);

// 2. Fallback: Serve the static Vite build for everything else
app.use('/*', serveStatic({ 
  root: './dist',
  // SPA Fallback: If the file isn't found, serve index.html for client-side routing
  // (Or if using Deck architecture, serve the workspace shell)
  rewriteRequestPath: (path) => {
    if (path === '/' || !path.includes('.')) {
      return '/index.html';
    }
    return path;
  }
}));

// Start the production server
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`🚀 Production Server running on http://localhost:${info.port}`);
});
```

---

## 4. The Agent Implementation Checklist

To make this architecture a reality, ensure the AI agents handle the following:

1.  **Separate Entry Points:** Maintain a clean separation between `src/server/entry.ts` (used by Vite plugin, exports just the `app`) and `server.production.ts` (used in production, imports the `app` and calls `serve()`).
2.  **Path Resolution:** Ensure the Board Engine's file-system scanner (`glob`) looks in `src/panels/` during dev, but correctly maps paths to the compiled `.js` files when running in the production build.
3.  **Environment Variables:** Standardize how the Client Kit determines its base URL. Because of the single port, API calls from the `.tsx` files should always use relative paths (e.g., `fetch('/__sursaut/batch-provide')`), never absolute URLs like `http://localhost:3000`.
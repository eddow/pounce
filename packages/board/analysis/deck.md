** TODO: Once api-routing is functional, tested and use **

# Sursaut Framework: The "Deck" Architecture (Workspaces & Panels)

## 1. The Paradigm Shift: Pages vs. Workspaces

The core Sursaut engine uses the `expose` function to map URLs to standard web pages and API endpoints (`/routes/users.ts` $\to$ `myapp.com/users`).

However, for complex, IDE-like, or dashboard-heavy applications (using layout managers like Dockview or GoldenLayout), the concept of "URL Routing" breaks down. Users stay on `myapp.com`, but the screen is divided into multiple independent **Panels** (Widgets/Micro-Frontends) that can be dragged, dropped, and resized.

To solve this, Sursaut introduces the **Deck Architecture**. 



Instead of treating the file system as a **Router**, the Deck architecture treats the file system as a **Panel Registry**.

---

## 2. File Structure: Routes become Panels

In a standard app, files live in `src/routes/`. In a Deck app, they live in `src/panels/` (or a similar designated directory). 

The mental model remains identical: One file = One feature.

* `src/panels/user-list.ts`: The Server API and Data Loader (`expose`).
* `src/panels/user-list.tsx`: The UI Component and Dockview metadata.

**The Server API (Panel Definition):**
```typescript
// panels/user-list.ts
import { expose } from '@sursaut/board';

export default expose({
    // 1. Initial Data Loader (Used when the panel is opened)
    provide: async (req) => { 
        return { users: await db.users.all() };
    },
    
    // 2. Panel-specific RPC endpoints
    './export': { 
        post: async (req) => { /* generate CSV */ } 
    }
});
```

## 3. The "Batch Provider" Problem
In a routed app, the server only needs to execute one provide function per request (e.g., loading the profile page).
In a Deck app, a user might load their workspace and instantly require five different panels to render simultaneously. Making five separate HTTP requests on initial load creates a slow, waterfall-like user experience.

The Solution: POST /__sursaut/batch-provide
The Board Engine automatically aggregates all provide functions from your panels. It exposes a hidden "Batch Provider" endpoint.

When the client loads the workspace layout, it requests all necessary data in a single network call:

```javascript
// The Client asks for data for 3 active panels
const data = await api.batchProvide(['chat', 'server-stats', 'user-list']);

/* The Board Engine runs all 3 providers in parallel and returns:
{
  'chat': { messages: [...] },
  'server-stats': { cpu: 45 },
  'user-list': { users: [...] }
}
*/
```

## 4. State Management: The SSR vs. LocalStorage Trap
When dealing with user-customizable layouts, you must choose how to store the workspace state (which panels go where). This choice directly dictates your SSR capabilities.

Approach A: The SPA Way (localStorage)
How it works: The user's layout is saved in the browser's localStorage.

The Catch: The server cannot read localStorage on the initial request. The server must send an empty HTML shell. The browser boots, reads localStorage, figures out which panels are open, and then hits the Batch Provider to get the data.

Result: A loading spinner on first paint.

Approach B: The SSR Way (Cookies)
How it works: The Client Kit syncs the layout JSON to a secure Cookie every time the user moves a panel.

The Benefit: When the user navigates to myapp.com, the server reads the Cookie, knows exactly which panels are active, runs their provide functions server-side, and ships fully hydrated HTML.

Result: Instant layout rendering with zero layout shift.

## 5. Seamless RPC Integration
The true power of the Deck architecture is that it doesn't break the RPC type inference built into expose.

Even though a panel is rendered inside a complex Dockview layout, the components inside that panel can still make fully-typed API calls to their sibling .ts file using the exact same Client Kit conventions:

```typescript
// panels/chat.tsx
import type ChatAPI from './chat.ts';
import { api, type InferProvide } from '@sursaut/kit';

export default function ChatPanel({ data }: { data: InferProvide<typeof ChatAPI> }) {
    const sendMessage = async (text) => {
        // Fully typed relative API call!
        await api<typeof ChatAPI>('/panels/chat/messages').post({ text });
    };

    return /* ... UI ... */;
}
```

## Summary
The Deck architecture transforms Sursaut from a website builder into an operating-system-level framework. By decoupling the provide loaders from the URL and attaching them to Panel IDs, developers get the organization of file-system routing combined with the flexibility of a modern Workspace UI.


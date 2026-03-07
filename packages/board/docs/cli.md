# Pounce-Board CLI

`@pounce/board` ships a `pounce` CLI for local development, production builds, and previewing the generated server bundle.

## Running it

```bash
pnpm exec pounce <command>
```

You can also invoke it through `npx` if the package is installed in the current project.

## Commands

### `pounce dev`

Starts the development server with Vite middleware, SSR rendering, route discovery, and route-local `+*` import resolution.

```bash
pounce dev [options]
```

Options:

- `--port <port>`
  - HTTP port for the app server
  - Default: `3000`
- `--hmr-port <port>`
  - Explicit port for Vite HMR
- `--routes <dir>`
  - Routes directory to scan
  - Default: `./routes`
- `--html <path>`
  - Entry HTML template used for SSR responses
  - Default: `./index.html`

Example:

```bash
pnpm exec pounce dev --port 5300 --routes ./demo/routes --html ./demo/index.html
```

### `pounce build`

Builds a client bundle and an SSR server bundle.

```bash
pounce build [options]
```

Options:

- `--out <dir>`
  - Output directory
  - Default: `./dist`

Current build output structure:

- `dist/client`
  - Browser assets and manifest
- `dist/server`
  - Generated Node server entry and SSR bundle

Example:

```bash
pnpm exec pounce build --out ./dist
```

### `pounce preview`

Starts the built server bundle from `dist/server/pounce-server-entry.js`.

```bash
pnpm exec pounce preview
```

This command assumes you already ran `pounce build`.

## Notes

- `dev` is the most up-to-date path and is the main workflow used by the demo and board e2e tests.
- In development, the server uses Vite SSR loading for route modules and preserves route-local `+shared` / `+components` resolution.
- `preview` launches the generated Node entry with `NODE_ENV=production`.

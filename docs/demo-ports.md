# Demo Port Allocation

Each package with a demo server runs on a dedicated port to avoid conflicts:

## Port Allocation

| Package | Port | Command | Purpose |
|---------|------|---------|---------|
| @pounce/ui | 5270 | `pnpm demo` | UI component demos |
| @pounce/kit | 5280 | `pnpm demo` | Kit adapter demos |
| @pounce/core | 5290 | `pnpm demo` / `pnpm dev` | Core framework demos |
| @pounce/board | 5300 | `pnpm demo` | Board app demos |

## E2E Test Configuration

Each package's Playwright config is configured to:
1. Use the package's dedicated port
2. Auto-launch the demo server via `pnpm demo` if not already running
3. Reuse existing servers to avoid unnecessary restarts

### Workspace Scripts

From the root, you can:
- `pnpm demo` - Start all demos
- `pnpm demo:ui` - Start UI demo only
- `pnpm demo:kit` - Start Kit demo only
- `pnpm demo:core` - Start Core demo only
- `pnpm demo:board` - Start Board demo only
- `pnpm test:e2e` - Run all e2e tests (auto-launches demos as needed)

## Development Workflow

1. Make changes to source code
2. Run `pnpm test:e2e` in the specific package or from root
3. Tests will automatically launch the demo on the correct port
4. No need to build `dist/` - demos use source directly via Vite resolution

## Port Range

Ports 5270-5299 are reserved for Pounce package demos, leaving room for additional packages.

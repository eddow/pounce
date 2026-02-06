# Pounce LLM Cheat Sheet

## Coding Standards
1. **Imports**: Do NOT include file extensions (like `.ts`, `.tsx`) in import paths.
   - Correct: `import { foo } from './bar'`
   - Incorrect: `import { foo } from './bar.ts'`
2. If what you care of depends on the environment (node/dom), read the [Dual entry-point policy](./dual-ep-policy.md).
3. **JSX Types**: Global JSX types (`h`, `Fragment`, `JSX.IntrinsicElements`) come from `@pounce/core/dist/types/jsx.d.ts`, linked via `/// <reference>` in `dist/index.d.ts`.
   - Ensure `@pounce/core` is built (`pnpm -C packages/core build`)
   - Check `tsconfig.json` paths point to `dist/` not `dist/src/`
   - Test directories need their own `tsconfig.json` extending the main one (they're excluded by default)
   - See `packages/plugin/sandbox/application.md` for detailed investigation
4. Project state: The project is not even alpha, the only consumers are the test: Backward compatibility is *never* an issue
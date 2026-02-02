# Pounce LLM Cheat Sheet

## Coding Standards
1. **Imports**: Do NOT include file extensions (like `.ts`, `.tsx`) in import paths.
   - Correct: `import { foo } from './bar'`
   - Incorrect: `import { foo } from './bar.ts'`
2. If what you care of depends on the environment (node/dom), read the [Dual entry-point policy](./dual-ep-policy.md).
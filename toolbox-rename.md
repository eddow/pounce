# Renaming `toolbox` to `kit` - Walkthrough

This document outlines all the steps required to rename the `packages/toolbox` package to `packages/kit`.

## Overview

The `toolbox` package is a foundational utility library used by:
- `packages/board` - Server/client framework
- `packages/pico` - UI component library
- `packages/core` - Previously had a misplaced test file (now removed)

## Pre-Rename Cleanup

- [x] Remove misplaced `route.test.ts` from `core/tests/` (imported from `toolbox`)
- [x] Verify no other cross-package imports from `core` to `toolbox`

## Phase 1: Package Structure

- [ ] Rename folder: `packages/toolbox` → `packages/kit`
- [ ] Update `packages/kit/package.json`:
  - Change `"name": "@pounce/toolbox"` → `"name": "@pounce/kit"`
  - Update any internal references

## Phase 2: Dependent Package Updates

### Board Package (`packages/board/`)

- [ ] Update imports in `src/server/index.ts` (4 references)
- [ ] Update imports in `src/client/index.ts` (2 references)
- [ ] Update imports in `src/types.ts` (4 references)
- [ ] Update imports in `src/adapters/hono.ts` (1 reference)
- [ ] Update `tsconfig.json` path alias for `@pounce/toolbox`
- [ ] Update `tsconfig.build.json` path aliases (9 references)
- [ ] Update documentation: `walkthrough.md` (16 references)
- [ ] Update test: `tests/integration/context-extension.spec.ts` (2 references)

### Pico Package (`packages/pico/`)

- [ ] Update imports in component files:
  - `src/components/alert.tsx`
  - `src/components/button.tsx`
  - `src/components/buttongroup.tsx`
  - `src/components/checkbutton.tsx`
  - `src/components/dark-mode-button.tsx` (2 references)
  - `src/components/dialog.tsx`
  - `src/components/dockview.tsx`
  - `src/components/forms.tsx`
  - `src/components/icon.tsx`
  - `src/components/infinite-scroll.tsx`
  - `src/components/layout.tsx`
  - `src/components/menu.tsx` (2 references)
  - `src/components/multiselect.tsx`
  - `src/components/radiobutton.tsx`
  - `src/components/stars.tsx`
  - `src/components/status.tsx`
  - `src/components/toast.tsx`
  - `src/components/toolbar.tsx`
  - `src/components/typography.tsx` (2 references)
- [ ] Update `src/main.tsx` (1 reference)
- [ ] Update `src/routes/display.tsx` (1 reference)
- [ ] Update `src/routes/toolbar.tsx` (1 reference)
- [ ] Update `tsconfig.json` path alias
- [ ] Update `vite-plugin-css-tag.ts` (1 reference)
- [ ] Update documentation: `docs/css.md` (4 references)

### Core Package (`packages/core/`)

- [ ] Update `src/lib/index.ts` (1 reference)
- [ ] Update `tsconfig.json` if path alias exists

## Phase 3: Build Configuration

- [ ] Update root `pnpm-lock.yaml` workspace references (5 references)
- [ ] Update `.vscode/tasks.json` build tasks (2 references)
- [ ] Regenerate lockfile: `pnpm install`

## Phase 4: Documentation

- [ ] Update root `README.md` (3 references)
- [ ] Update `pounce-board.md` (16 references)
- [ ] Update any package-specific README files

## Phase 5: Verification

- [ ] Run type-check across all packages: `pnpm type-check`
- [ ] Run tests in `kit` package: `pnpm --filter @pounce/kit test`
- [ ] Run tests in dependent packages
- [ ] Build all packages: `pnpm build`
- [ ] Verify no remaining "toolbox" references (excluding node_modules): `grep -r "toolbox" packages/ --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" | grep -v node_modules`

## Notes

- Import patterns to update:
  - `from '@pounce/toolbox'` → `from '@pounce/kit'`
  - `from '../../toolbox/...'` → `from '../../kit/...'` (relative imports)
  - `from '@pounce/toolbox/...'` → `from '@pounce/kit/...'` (subpath imports)

- The `toolbox` package has two entry points:
  - Main entry: `src/index.ts` (DOM-dependent utilities)
  - No-DOM entry: `src/entry-no-dom.ts` (server-safe utilities)

- Ensure both entry points continue to work after rename.

# JSX Runtime and Test Environment Setup Trials

## Objective
Fix the `(0 , __vite_ssr_import_0__.jsxDEV) is not a function` errors in UI package Vitest tests, ensuring JSX runtime functions are properly imported and available during test execution, especially for VSCode extension compatibility.

## Root Causes Identified

1. **Dual Entry Point Architecture**: `@pounce/core` has multiple entry points (DOM, Node, Test) with different initialization requirements
2. **JSX Runtime Resolution**: JSX transform imports from `@pounce/core/jsx-dev-runtime` but test imports from `@pounce/core/test`
3. **AsyncLocalStorage (ALS) Context**: Node entry point uses ALS proxies for DOM APIs, requiring proper context initialization
4. **Module Instance Conflicts**: Different import paths resolve to different module instances, breaking JSX runtime function references
5. **VSCode Extension Limitation**: VSCode doesn't run Vitest setup files, requiring test entry point to self-initialize

---

## Trial 1: Alias `@pounce/core` to Test Entry Point
**Approach**: Override `@pounce/core` alias in UI vitest config to point to test entry point.

**Files Modified**:
- `/home/fmdm/dev/ownk/pounce/packages/ui/vitest.config.ts`

**Result**: ❌ **FAILED**
- JSX runtime still not resolved
- Conflict between test entry point and JSX runtime subpath imports
- Error: `jsxDEV is not a function`

**Why It Failed**: The JSX transform imports from `@pounce/core/jsx-dev-runtime` as a subpath, but aliasing `@pounce/core` to test entry doesn't affect subpath resolution.

---

## Trial 2: Export JSX Runtime from Test Entry Point
**Approach**: Make test entry point explicitly export JSX runtime functions.

**Files Modified**:
- `/home/fmdm/dev/ownk/pounce/packages/core/src/test/index.ts`
  ```typescript
  export { jsx, jsxDEV, jsxs, Fragment } from '../runtime/jsx-runtime'
  ```

**Result**: ❌ **FAILED**
- Created duplicate module instances
- JSX transform's `jsxDEV` !== test entry's `jsxDEV`
- Error: `jsxDEV is not a function`

**Why It Failed**: Re-exporting creates a different module instance. The JSX transform and test imports resolve to different function references.

---

## Trial 3: Export JSX Runtime from Main Index
**Approach**: Add JSX runtime exports to main `@pounce/core` index for VSCode resolution.

**Files Modified**:
- `/home/fmdm/dev/ownk/pounce/packages/core/src/index.ts`
  ```typescript
  export { jsx, jsxDEV, jsxs } from './runtime/jsx-runtime'
  ```

**Result**: ⚠️ **PARTIAL SUCCESS**
- VSCode extension could resolve JSX types
- But created `Fragment` export conflict (already exported from `./lib`)
- CLI tests still failed

**Why It Failed**: Duplicate `Fragment` export caused build errors. Didn't solve the module instance problem.

---

## Trial 4: Lazy JSX Runtime Initialization
**Approach**: Make JSX runtime functions lazily initialize JSDOM when first called.

**Files Modified**:
- `/home/fmdm/dev/ownk/pounce/packages/core/src/runtime/jsx-runtime.ts`
  ```typescript
  function ensureDOM() {
    if (!domInitialized && typeof window === 'undefined') {
      const { JSDOM } = require('jsdom')
      // ... setup
    }
  }
  ```

**Result**: ❌ **FAILED**
- Lazy initialization never triggered
- Error occurred in `beforeEach` hook before JSX was processed
- Error: `Cannot read properties of null (reading 'createElement')`

**Why It Failed**: The error happens when calling `document.createElement()` in test setup, before any JSX is rendered. Lazy initialization in JSX runtime doesn't help.

---

## Trial 5: Immediate DOM Setup in Test Entry Point
**Approach**: Set up JSDOM immediately when test entry point is imported.

**Files Modified**:
- `/home/fmdm/dev/ownk/pounce/packages/core/src/test/index.ts`
  ```typescript
  const { JSDOM } = require('jsdom')
  const jsdom = new JSDOM(...)
  globalThis.window = jsdom.window
  globalThis.document = jsdom.window.document
  ```

**Result**: ⚠️ **PARTIAL SUCCESS**
- Global `window` and `document` set correctly
- Debug output showed: `Window constructor: Window`, `Document exists: true`
- But `shared.document` export still undefined

**Why It Failed**: Setting `globalThis.document` doesn't update the `shared.document` export that tests import.

---

## Trial 6: Bootstrap Node Entry Point with ALS
**Approach**: Call node entry's `bootstrap()` function to set up ALS context and proxies.

**Files Modified**:
- `/home/fmdm/dev/ownk/pounce/packages/core/src/test/index.ts`
  ```typescript
  import { bootstrap } from '../node'
  bootstrap()
  ```

**Result**: ⚠️ **PARTIAL SUCCESS**
- ALS context initialized
- But `bootstrap()` overwrites `shared.setWindow()` with ALS proxies
- Document still null because proxies require ALS context to be active

**Why It Failed**: The `bootstrap()` function sets up ALS proxies that expect to be called within an ALS context (like `withSSR()`), but test environment doesn't have active ALS context.

---

## Trial 7: Call setWindow Before Bootstrap
**Approach**: Call `shared.setWindow()` with actual JSDOM objects before calling `bootstrap()`.

**Files Modified**:
- `/home/fmdm/dev/ownk/pounce/packages/core/src/test/index.ts`
  ```typescript
  shared.setWindow({
    window: globalThis.window,
    document: globalThis.document,
    // ... other DOM APIs
  })
  bootstrap()
  ```

**Result**: ⚠️ **PARTIAL SUCCESS**
- `shared.document` properly set to JSDOM document
- ALS context initialized
- Debug output confirmed all setup steps completed
- But tests still fail with "Effect caught: TypeError"

**Why It Failed**: The `bootstrap()` function overwrites the `shared.setWindow()` call with ALS proxies. The order matters, and calling `bootstrap()` after `setWindow()` breaks the setup.

---

## Trial 8: Point JSX Runtime Aliases to Compiled Files
**Approach**: Update vitest config to alias JSX runtime subpaths to compiled dist files.

**Files Modified**:
- `/home/fmdm/dev/ownk/pounce/test/vitest.config.base.ts`
  ```typescript
  '@pounce/core/jsx-runtime': resolve(rootDir, '../packages/core/dist/jsx-runtime.js')
  '@pounce/core/jsx-dev-runtime': resolve(rootDir, '../packages/core/dist/jsx-dev-runtime.js')
  ```

**Result**: ⚠️ **CURRENT STATE**
- JSX runtime files now built as separate bundles
- Aliases point to correct files
- DOM setup working perfectly
- But document still becomes null at some point

**Why It's Failing**: Unknown - the setup completes successfully but document becomes null later. Possibly:
1. `bootstrap()` is overwriting the setup
2. ALS context is not active when tests run
3. Some other code is resetting the shared exports

---

## Current State Analysis

### What's Working ✅
1. **JSDOM Setup**: Successfully creates JSDOM environment
2. **Global Variables**: `globalThis.window` and `globalThis.document` are set
3. **Debug Output**: All initialization steps complete successfully
4. **Test Entry Point**: Properly imported and executed
5. **JSX Runtime Files**: Built as separate bundles

### What's Not Working ❌
1. **Document Access**: `document` is null when tests try to use it
2. **ALS Context**: Either not active or proxies not working correctly
3. **Module Instances**: Possible mismatch between different import paths

### The Core Problem
The fundamental issue is the **conflict between two initialization strategies**:

1. **Test Environment**: Needs direct access to JSDOM objects
   - `document.createElement()` should work directly
   - No ALS context needed

2. **Node/SSR Environment**: Uses ALS proxies for context isolation
   - `document` is a proxy that looks up the real document in ALS
   - Requires active ALS context

The test entry point tries to satisfy both, but they're incompatible:
- Setting up real JSDOM objects works
- But calling `bootstrap()` overwrites them with ALS proxies
- ALS proxies don't work without active context
- Result: `document` is null

---

## Recommended Solution

**Don't use the Node entry point for tests.** Instead:

1. **Test Entry Point**: Set up JSDOM and export real objects directly
   - Don't call `bootstrap()`
   - Don't use ALS proxies
   - Just export the actual JSDOM objects

2. **Package.json Exports**: Ensure proper subpath exports
   ```json
   "./test": {
     "types": "./src/test/index.d.ts",
     "default": "./src/test/index.ts"
   }
   ```

3. **Vitest Config**: Alias `@pounce/core` to test entry, not node entry
   ```typescript
   '@pounce/core': resolve(rootDir, '../packages/core/src/test/index.ts')
   ```

4. **Test Entry Implementation**:
   ```typescript
   // Set up JSDOM
   const jsdom = new JSDOM(...)
   globalThis.window = jsdom.window
   globalThis.document = jsdom.window.document
   
   // Update shared exports - DON'T call bootstrap()
   shared.setWindow({
     window: globalThis.window,
     document: globalThis.document,
     // ... other DOM APIs from JSDOM
   })
   
   // Export everything
   export * from '..'
   ```

**Key Insight**: Tests need real DOM objects, not ALS proxies. The node entry point is designed for SSR with context isolation, which is unnecessary and problematic for tests.

---

## Lessons Learned

1. **Module Instances Matter**: Re-exporting creates new instances; use aliases instead
2. **ALS is for SSR**: Don't use ALS proxies in test environments
3. **Setup Order Matters**: Setting up globals then calling bootstrap() breaks everything
4. **VSCode Limitations**: Extension doesn't run setup files, requiring self-initializing entry points
5. **Dual Entry Points**: Different environments need different initialization strategies
6. **Keep It Simple**: Tests should use direct JSDOM access, not proxy layers

---

## Status: UNRESOLVED

The issue remains that `document` becomes null despite successful initialization. Further investigation needed to determine:
1. Why `bootstrap()` is being called (or if it should be)
2. Whether ALS context is required for tests
3. If there's a better way to structure the test entry point

# @pounce/kit vs @pounce/ui: Responsibility Boundary

This document clarifies the separation of concerns between `@pounce/kit` (low-level framework utilities) and `@pounce/ui` (UI component library).

## 🎯 Core Principle

**@pounce/kit**: Framework infrastructure (SSR, routing, CSS injection, storage)  
**@pounce/ui**: UI components built on top of kit

## ⚠️ CRITICAL: SSR Safety

**`@pounce/ui` can be imported from SSR contexts!**

`@pounce/kit` uses **dual entry-point architecture**:
- Import `@pounce/kit` → automatically resolves to `kit/dom` or `kit/node` based on context
- SSR (Node.js) → uses `kit/node` exports
- Client (Browser) → uses `kit/dom` exports

```typescript
// ✅ CORRECT - Entry point selected automatically
import { sass } from '@pounce/kit'
// → kit/node/index.ts during SSR
// → kit/dom/index.ts in browser
```

**Why this matters:**
- `@pounce/ui` components render during SSR
- Kit's dual entry-point ensures correct utilities are loaded
- No manual entry-point selection needed
- Works seamlessly in both Node and browser contexts

## 📦 Current State: @pounce/kit

### What Kit Provides

From `/home/fmdm/dev/ownk/pounce/packages/kit/src/dom/css.ts`:

```typescript
// CSS/SASS tagged template utilities
export function css(strings: TemplateStringsArray, ...values: any[]): void
export function sass(strings: TemplateStringsArray, ...values: any[]): void
export function scss(strings: TemplateStringsArray, ...values: any[]): void

// SSR support
export function __injectCSS(css: string): void
export function getSSRStyles(): string
```

**Key Features**:
- ✅ Vite plugin integration (transforms tagged templates at build time)
- ✅ SSR style collection (`ssrStyles` Map)
- ✅ Hydration support (reads `data-hydrated-hashes` from DOM)
- ✅ Automatic deduplication (hash-based)
- ✅ Per-file style tags (`data-vite-css-id` based on caller)
- ✅ PostCSS/SASS preprocessing

**Kit Structure**:
```
kit/src/
├── dom/          # DOM-specific (css.ts, storage.ts, client.ts)
├── node/         # Node-specific (SSR utilities)
├── ssr/          # SSR rendering
├── router/       # Routing
├── api/          # API utilities
└── index.ts      # Shared exports
```

## 🤔 Potential Extensions for @pounce/ui

### Option 1: Extend Kit's CSS Utilities (Recommended)

Add UI-specific CSS utilities to `@pounce/kit`:

```typescript
// @pounce/kit/src/dom/css.ts

/**
 * CSS with @layer support for component libraries
 * Automatically wraps CSS in specified layer
 */
const registeredLayers = new Set<string>()

export function layer(layerName: string) {
  return (strings: TemplateStringsArray, ...values: any[]): void => {
    // Register layer on first use
    if (!registeredLayers.has(layerName)) {
      registeredLayers.add(layerName)
      __injectCSS(`@layer ${layerName};`)
    }
    
    const cssText = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    const layeredCSS = `@layer ${layerName} {\n${cssText}\n}`
    __injectCSS(layeredCSS)
  }
}

// Note: This function can be "flavored" with additional functionality (cf. mutts)

// Usage in @pounce/ui components:
import { layer } from '@pounce/kit/dom'

const componentCSS = layer('pounce.components')

componentCSS`
  .pounce-button {
    display: inline-flex;
    background: var(--pounce-primary);
  }
`
```

**Pros**:
- ✅ Keeps CSS infrastructure in one place
- ✅ All components benefit from SSR/hydration
- ✅ Consistent API across framework
- ✅ No duplication of SSR logic

**Cons**:
- ❌ Adds UI-specific concept to kit
- ❌ Kit becomes slightly less "pure infrastructure"

---

### Option 2: UI-Specific Wrapper (Alternative)

Keep kit pure, add thin wrapper in `@pounce/ui`:

```typescript
// @pounce/ui/src/styles/layer.ts
import { __injectCSS } from '@pounce/kit/dom'

export function componentStyle(strings: TemplateStringsArray, ...values: any[]): void {
  const cssText = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
  const layeredCSS = `@layer pounce.components {\n${cssText}\n}`
  __injectCSS(layeredCSS)
}

export function baseStyle(strings: TemplateStringsArray, ...values: any[]): void {
  const cssText = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
  const layeredCSS = `@layer pounce.base {\n${cssText}\n}`
  __injectCSS(layeredCSS)
}

// Usage:
import { componentStyle } from '@pounce/ui/styles/layer'

componentStyle`
  .pounce-button {
    background: var(--pounce-primary);
  }
`
```

**Pros**:
- ✅ Kit remains pure infrastructure
- ✅ UI-specific concerns stay in UI package
- ✅ Clear separation of responsibilities

**Cons**:
- ❌ Slight duplication (wrapper functions)
- ❌ Less discoverable (users need to know about UI-specific utilities)

---

### Option 3: Hybrid Approach (Best of Both) ✅ SELECTED

Add generic `layer` function to kit, UI provides convenience exports:

```typescript
// @pounce/kit/src/dom/css.ts
const registeredLayers = new Set<string>()

export function layer(layerName: string) {
  return (strings: TemplateStringsArray, ...values: any[]): void => {
    // Auto-register layer on first use (generates @layer declaration)
    if (!registeredLayers.has(layerName)) {
      registeredLayers.add(layerName)
      __injectCSS(`@layer ${layerName};`)
    }
    
    const cssText = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    const layeredCSS = `@layer ${layerName} {\n${cssText}\n}`
    __injectCSS(layeredCSS)
  }
}

// @pounce/ui/src/styles/index.ts
import { layer } from '@pounce/kit/dom'

export const componentStyle = layer('pounce.components')
export const baseStyle = layer('pounce.base')

// Usage in @pounce/ui:
import { componentStyle } from '@pounce/ui/styles'

componentStyle`
  .pounce-button {
    background: var(--pounce-primary);
  }
`
```

**Pros**:
- ✅ Generic utility in kit (reusable for other libraries)
- ✅ Convenient exports in UI
- ✅ Clear separation: kit = mechanism, ui = policy
- ✅ Other packages can use `layer()` for their own layers
- ✅ Auto-registers layers (generates `@layer x, y;` declaration)
- ✅ Can be "flavored" with additional functionality (cf. mutts pattern)

**Cons**:
- None significant

---

## 🎯 Recommendation: Option 3 (Hybrid)

### Changes to @pounce/kit

Add to `kit/src/dom/css.ts`:

```typescript
/**
 * Create a CSS template tag that wraps output in a CSS @layer
 * Automatically registers the layer on first use
 * 
 * Note: This function can be "flavored" with additional functionality (cf. mutts)
 * 
 * @param layerName - The CSS layer name (e.g., 'components', 'utilities')
 * @returns A template tag function that injects layered CSS
 * 
 * @example
 * ```ts
 * const componentCSS = layer('components')
 * componentCSS`.button { color: blue; }`
 * // First call injects: @layer components;
 * // Then injects: @layer components { .button { color: blue; } }
 * ```
 */
const registeredLayers = new Set<string>()

export function layer(layerName: string) {
  return (strings: TemplateStringsArray, ...values: any[]): void => {
    // Register layer on first use
    if (!registeredLayers.has(layerName)) {
      registeredLayers.add(layerName)
      __injectCSS(`@layer ${layerName};`)
    }
    
    const cssText = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    const layeredCSS = `@layer ${layerName} {\n${cssText}\n}`
    __injectCSS(layeredCSS)
  }
}
```

### Changes to @pounce/ui

Create `ui/src/styles/index.ts`:

```typescript
import { layer } from '@pounce/kit/dom'

/**
 * CSS template tag for Pounce UI base styles (variables, resets)
 * Wraps CSS in @layer pounce.base
 */
export const baseStyle = layer('pounce.base')

/**
 * CSS template tag for Pounce UI component styles
 * Wraps CSS in @layer pounce.components
 */
export const componentStyle = layer('pounce.components')
```

### Usage in Components

```typescript
// @pounce/ui/src/components/button.tsx
import { componentStyle } from '../styles'

componentStyle`
  .pounce-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--pounce-primary);
    color: white;
    border: none;
    cursor: pointer;
    
    &:hover {
      filter: brightness(0.9);
    }
  }
`

export const Button = (props) => {
  // Component implementation
}
```

---

## 📋 Other Potential Kit Extensions

### 1. Theme Management

**Decision**: ✅ **Belongs in @pounce/ui as shared state**

```typescript
// @pounce/ui/src/shared/theme.ts
import { reactive } from 'mutts'

/**
 * Shared UI state for @pounce/ui
 * Simple reactive value - no opinions about theme names
 * Supports any theme: 'light', 'dark', 'sepia', 'high-contrast', etc.
 */
export const ui = reactive({
  theme: 'light' as string  // Generic string, any value allowed
})

// That's it. No methods.
// Reactivity is handled by mutts automatically.
```

**Why just a string?**
- Generic - supports any number of themes (not just light/dark)
- Simple - no methods, just assign: `ui.theme = 'dark'`
- Reactive - mutts handles change propagation automatically
- Flexible - apps can define their own theme names

**System Preference Detection**: Kit's responsibility via `client.prefersDark()`

**Usage Example**:
```typescript
import { ui } from '@pounce/ui/shared/theme'
import { client } from '@pounce/kit/dom'

// Initialize from system preference
ui.theme = client.prefersDark() ? 'dark' : 'light'

// Change theme (reactivity propagates automatically)
ui.theme = 'dark'
ui.theme = 'sepia'
ui.theme = 'high-contrast'

// Observe theme changes
$effect(() => {
  console.log('Theme changed to:', ui.theme)
})
```

**Adapter Integration Example**:
```typescript
// @pounce/ui-pico watches ui.theme and updates PicoCSS
import { ui } from '@pounce/ui/shared/theme'

$effect(() => {
  document.documentElement.setAttribute('data-theme', ui.theme)
})
// PicoCSS CSS handles the rest via [data-theme="..."] selectors
```

---

### 2. CSS Variable Utilities

**Decision**: ✅ **Belongs in @pounce/kit (generic infrastructure)**

```typescript
// @pounce/kit/src/dom/css-vars.ts

/**
 * Set a CSS custom property (variable)
 * Handles both --prefixed and non-prefixed names
 */
export function setCSSVar(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  const varName = name.startsWith('--') ? name : `--${name}`
  element.style.setProperty(varName, value)
}

/**
 * Get a CSS custom property (variable) value
 * Returns the computed value
 */
export function getCSSVar(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  const varName = name.startsWith('--') ? name : `--${name}`
  return getComputedStyle(element).getPropertyValue(varName).trim()
}

/**
 * Remove a CSS custom property (variable)
 */
export function removeCSSVar(
  name: string,
  element: HTMLElement = document.documentElement
): void {
  const varName = name.startsWith('--') ? name : `--${name}`
  element.style.removeProperty(varName)
}
```

**Why kit?**
- Generic utility - any package might need CSS variable manipulation
- Not UI-specific - could be used for theming, animations, etc.
- Simple DOM API wrapper with convenience features

**Usage in @pounce/ui**:
```typescript
import { setCSSVar, getCSSVar } from '@pounce/kit/dom'

// Dynamic theme color adjustment
export function adjustPrimaryColor(hue: number) {
  setCSSVar('pounce-primary', `hsl(${hue}, 70%, 50%)`)
}
```

---

### 3. Media Query / Responsive Utilities

**Decision**: ✅ **Belongs in @pounce/kit (generic infrastructure)**

```typescript
// @pounce/kit/src/dom/media.ts
import { reactive } from 'mutts'

/**
 * Create a reactive media query matcher
 * Returns reactive state that updates when query matches/unmatches
 */
export function useMediaQuery(query: string) {
  const state = reactive({ matches: false })
  
  if (typeof window === 'undefined') return state
  
  const mediaQuery = window.matchMedia(query)
  state.matches = mediaQuery.matches
  
  mediaQuery.addEventListener('change', (e) => {
    state.matches = e.matches
  })
  
  return state
}

/**
 * Common breakpoint presets
 */
export const breakpoints = {
  mobile: '(max-width: 640px)',
  tablet: '(min-width: 641px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
}
```

**Why kit?**
- Generic utility - responsive behavior needed across entire framework
- Not UI-specific - routing, data fetching, etc. might need responsive logic
- Provides reactive primitives that any package can use

**Usage in @pounce/ui**:
```typescript
import { useMediaQuery, breakpoints } from '@pounce/kit/dom'

export const ResponsiveNav = () => {
  const isMobile = useMediaQuery(breakpoints.mobile)
  
  return (
    <nav>
      {isMobile.matches ? <MobileMenu /> : <DesktopMenu />}
    </nav>
  )
}
```

---

## 🎯 Final Boundary Definition

### @pounce/kit Responsibilities

- ✅ CSS/SASS tagged template infrastructure
- ✅ SSR style collection and hydration
- ✅ Generic `layer()` utility (auto-registers layers)
- ✅ CSS variable get/set utilities
- ✅ Media query utilities
- ✅ Theme detection (system preference)
- ✅ Storage, routing, API utilities

**Kit is framework infrastructure** - generic, reusable, no UI opinions.

---

### @pounce/ui Responsibilities

- ✅ Component implementations
- ✅ Pounce-specific layer names (`baseStyle`, `componentStyle`)
- ✅ CSS variable contract (`--pounce-*`)
- ✅ Adapter architecture
- ✅ Framework-specific theme switching (PicoCSS, Tailwind)
- ✅ Component-specific directives

**UI is component library** - opinionated, framework-specific, built on kit.

---

## 📝 Action Items for Phase 0

When implementing Phase 0, add to `@pounce/kit`:

1. **Add `layer()` to `kit/src/dom/css.ts`** ⚠️ **BLOCKED - NOT NEEDED**
   - **Update**: Colleague implemented Vite plugin solution instead
   - Vite plugin automatically wraps `componentStyle` and `baseStyle` in `@layer`
   - No runtime overhead, build-time transformation
   - Kit remains unchanged (no breaking changes needed)

2. **Add CSS variable utilities to `kit/src/dom/css-vars.ts`** (optional)
   - `setCSSVar()`, `getCSSVar()`
   - Generic, not UI-specific

3. **Update `kit/src/dom/index.ts`** to export new utilities

Then in `@pounce/ui`:

1. **Create `ui/src/styles/index.ts`**
   - Export `baseStyle = layer('pounce.base')`
   - Export `componentStyle = layer('pounce.components')`

2. **Create `ui/src/shared/theme.ts`**
   - Export `ui = reactive({ theme: 'light' })` - simple reactive string
   - No methods - just a reactive value
   - Generic - supports any theme names (not limited to light/dark)

2. **Use in components**
   - Import `componentStyle` instead of raw `sass`
   - Ensures all component styles are layered correctly

---

## 🚀 Migration Path

### Before (using raw sass):
```typescript
import { sass } from '@pounce/kit/dom'

sass`
  .pp-button {
    background: var(--pico-primary);
  }
`
```

### After (using layered styles):
```typescript
import { componentStyle } from '@pounce/ui/styles'

componentStyle`
  .pounce-button {
    background: var(--pounce-primary);
  }
`
```

The `componentStyle` automatically wraps in `@layer pounce.components`, ensuring correct cascade order.

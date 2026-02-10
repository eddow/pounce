# Orthogonal Concerns in @pounce/ui Adapter System

## Identified Orthogonal Concerns

These are the independent configuration points that `@pounce/ui` needs to handle agnostically:

### 1. Icons
- **What**: Icon rendering system
- **Why orthogonal**: Different icon libraries (Heroicon, Lucide, Pure-glyf, Font Awesome, etc.)
- **Configuration**: `iconFactory?: (name: string, size: string | number | undefined, context: DisplayContext) => JSX.Element`
- **Example packages**: 
  - `@pounce/adapter-icons-glyf`
  - `@pounce/adapter-icons-heroicon`
  - `@pounce/adapter-icons-lucide`

**Note on Icon Mirroring (RTL/LTR)**:
- Icon names like `arrow-forward` vs `arrow-right` is an icon-library concern
- Per-icon-library override: `heroIconArrowForward = browser.ltr ? this : that`
- **TODO**: Document in icon-manager as future enhancement
- Not part of core adapter system

### 2. Variants (Styling + A11y)
- **What**: Semantic variant names mapped to `Trait` objects (classes + styles + attributes)
- **Why orthogonal**: Different CSS frameworks (Pico, Tailwind, Bootstrap, custom)
- **Configuration**: `variants?: Record<string, Trait>` (Trait from `@pounce/core`)
  - Traits bundle classes, styles, AND attributes (including ARIA)
  - Example: `danger` trait → `{ classes: ['text-red-500'], attributes: { 'data-variant': 'danger', 'aria-live': 'polite' } }`
- **Example packages**:
  - `@pounce/adapter-pico` (Pico variants)
  - `@pounce/adapter-tailwind` (Tailwind variants)
  - Custom inline configuration

**Note**: A11y is part of variants via Traits, not a separate concern

### 3. Components (Structure + Classes)
- **What**: Per-component class mappings AND DOM structure overrides
- **Why orthogonal**: Each framework may structure components differently
- **Configuration**: 
  ```typescript
  components?: {
    [ComponentName]: {
      classes?: Record<string, string>
      renderStructure?: (parts: ComponentParts) => JSX.Element
    }
  }
  ```
- **Example**: Tailwind might need specific DOM nesting that Pico doesn't

### 4. Transitions (Animations)
- **What**: Enter/exit animation classes and timing
- **Why orthogonal**: Different animation libraries/strategies
- **Configuration**: 
  ```typescript
  transitions?: {
    enterClass?: string
    exitClass?: string
    activeClass?: string
    duration?: number
  }
  ```
- **Scope**: Global default + per-component override
- **Example packages**:
  - `@pounce/ui-transitions-tailwind` (Tailwind transitions)
  - `@pounce/ui-transitions-framer` (Framer Motion)
  - Custom CSS transitions

### 5. Display Context (Theme, Direction, Locale)
- **What**: Theme switching, text direction, locale — all presentation concerns
- **Why orthogonal**: Not adapter concerns — these are runtime display state
- **Handled by**: `DisplayProvider` (scope-based, re-entrant) + `@pounce/kit` system values
- **Architecture**:
  - `@pounce/kit` provides reactive `client.direction`, `client.language` (auto-detected from DOM)
  - `@pounce/ui` provides `DisplayProvider` component that sets `data-theme`, `dir`, `lang` on its own DOM element
  - Nested providers override parent values; `'auto'` resolves from parent or system defaults
  - `useDisplayContext()` reads resolved values from scope
- **Not an adapter concern**: Adapters receive `DisplayContext` in `iconFactory` and `renderStructure` but don't configure it

See `display-context-architecture.md` and `TODO.md` (DisplayProvider Hierarchy) for full design.

## Non-Concerns (Handled Elsewhere)

### Class Ordering
- **Handled by**: `@pounce/core`
- **How**: Class arrays support ordering and removal
  - `[{myClass: false}, 'myClass']` removes and re-adds at end
- **Not an adapter concern**: Implementation detail of core

### CSS Management
- **Handled by**: User code
- **How**: Users can freely add `css\`...\`` or `sass\`...\``
- **Not an adapter concern**: Completely free, no centralization needed

### Accessibility (ARIA)
- **Handled by**: Variants via `trait` system
- **How**: Traits associate ARIA roles with semantic variants
- **Not a separate concern**: Part of variant configuration

### Event Delegation
- **Handled by**: Per-component configuration (overlays only)
- **How**: `events?: Record<string, EventTarget>` in overlay components
- **Not a global concern**: Too specific to overlay use cases

## Adapter Composition Architecture

### Composable Adapters Pattern

Adapters are composed via a single variadic `setAdapter()` call that merges left-to-right:

```typescript
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'
import { glyfIcons } from '@pounce/adapter-icons-glyf'

// Single call, merges left-to-right
setAdapter(picoAdapter, glyfIcons, {
  // Custom overrides (last wins)
  components: {
    Button: { classes: { base: 'my-custom-btn' } }
  }
})
```

### Precedence Rules

When multiple adapters configure the same concern:

1. **Icons**: Last `iconFactory` wins (complete replacement)
2. **Variants**: Deep merge (later variants override earlier)
3. **Components**: Deep merge per component (later classes override earlier)
4. **Transitions**: Last `transitions` wins globally, per-component overrides global
5. **Display Context**: Not an adapter concern — handled by `DisplayProvider`

### Merge Strategy

```typescript
export function setAdapter(...adapters: Partial<FrameworkAdapter>[]): void {
  for (const adapter of adapters) {
    currentAdapter = {
      // Complete replacement (last wins)
      iconFactory: adapter.iconFactory ?? currentAdapter.iconFactory,
      transitions: adapter.transitions ?? currentAdapter.transitions,
      
      // Deep merge (accumulative)
      variants: { ...currentAdapter.variants, ...adapter.variants },
      components: { ...currentAdapter.components, ...adapter.components }
    }
  }
}
```

### Example: Combining Adapters

```typescript
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'
import { glyfIcons } from '@pounce/adapter-icons-glyf'

// Single variadic call — merges left-to-right
setAdapter(picoAdapter, glyfIcons, {
  variants: {
    brand: { classes: ['my-brand-color'], attributes: { 'data-variant': 'brand' } }
  },
  components: {
    Button: {
      classes: { base: 'my-btn' }  // Override Pico's button base class
    }
  }
})
```

### Package Ecosystem

This enables a rich ecosystem of adapter packages:

**Framework Adapters**:
- `@pounce/adapter-pico` — PicoCSS framework (✅ implemented by pico-tee)
- `@pounce/adapter-tailwind` — Tailwind CSS framework (future)

**Icon Adapters**:
- `@pounce/adapter-icons-glyf` — Pure-glyf icons
- `@pounce/adapter-icons-heroicon` — Heroicons
- `@pounce/adapter-icons-lucide` — Lucide icons

Users mix and match in a single call:
```typescript
import { picoAdapter } from '@pounce/adapter-pico'
import { glyfIcons } from '@pounce/adapter-icons-glyf'

setAdapter(picoAdapter, glyfIcons)
```

## Analysis: Overridance and Composition

### Key Insights

1. **Separation of Concerns**: Each orthogonal concern can be configured independently
2. **Composability**: Multiple adapters can be combined via variadic `setAdapter()` call
3. **Overridance**: Later configurations override earlier ones (with merge strategy)
4. **Package Ecosystem**: Enables reusable adapter packages for different combinations
5. **Flexibility**: Users can mix framework adapters with different icon/transition libraries

### Current Implementation Status

✅ **Implemented**:
- Variadic `setAdapter()` with left-to-right merge
- Icon composition (`iconFactory` — global, receives `DisplayContext`)
- Variant composition (deep merge, `Record<string, Trait>`)
- Component composition (deep merge, typed per `UiComponents`)
- Transition composition (global + per-component via `TransitionConfig`)
- Transition helpers (`getTransitionConfig`, `applyTransition`)
- `@pounce/adapter-pico` — first adapter, fully functional
- `@pounce/kit` — `client.direction`, `client.language` reactive system values

⚠️ **Designed, Not Yet Implemented**:
- `DisplayProvider` (scope-based theme/direction/locale) — see `display-context-architecture.md`
- `ThemeToggle` component — see `TODO.md`
- Form validation states (`aria-invalid`, `aria-busy`) — see `TODO.md`

❌ **Future Enhancements**:
- Icon mirroring for RTL (icon-library concern, not adapter)
- Adapter validation for conflicts
- Card, Progress, Accordion components

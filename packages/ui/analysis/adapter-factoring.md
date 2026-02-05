# Adapter System Refactoring

**Status**: Planning  
**Priority**: High  
**Goal**: Improve type safety and centralize adapter concerns (icons, transitions, etc.)

---

## 1. Current Adapter Architecture

### 1.1 Overview

The adapter system provides a **framework-agnostic theming/styling bridge** that allows pounce/ui components to integrate with different CSS frameworks without hardcoding dependencies.

**Core Files**:
- `src/adapter/types.ts` - Type definitions
- `src/adapter/registry.ts` - Global registry with SSR safety
- `src/adapter/index.ts` - Public API

### 1.2 How Adapters Work

**Registration Pattern**:
```typescript
// At app startup (before any rendering)
import { setAdapter } from '@pounce/ui'

setAdapter({
  variants: {
    primary: 'my-primary-class',
    danger: 'my-danger-class'
  },
  components: {
    Button: {
      classes: {
        base: 'custom-button',
        iconOnly: 'custom-icon-btn'
      },
      iconResolver: (name) => <MyIcon name={name} />
    }
  }
})
```

**Component Usage**:
```typescript
// Inside a component
const adapter = getAdapter('Button')

// Use adapter configuration
const baseClass = adapter.classes?.base || 'pounce-button'
const icon = adapter.iconResolver?.(iconName) || iconName
```

**Variant Resolution** (3-tier fallback):
1. Component-specific adapter classes (`adapter.classes?.[variant]`)
2. Global adapter variants (`getGlobalVariants()?.[variant]`)
3. Standard vanilla conventions (`pounce-variant-${variant}`)

### 1.3 Current Type System

```typescript
export type UiComponents = {
  Button: any        // ❌ No type safety
  Badge: any
  Dockview: any
  // ... all components use `any`
}

export type ComponentAdapter<Props = any> = {
  classes?: Partial<Record<string, string>>
  renderStructure?: (parts: ComponentParts<Props>) => JSX.Element
  events?: Partial<Record<string, EventTarget>>
  transitions?: TransitionConfig
  iconPlacement?: IconPlacement
  iconResolver?: (name: string, size?: string | number) => JSX.Element
  icons?: Record<string, string>
}
```

**Problem**: Every component can configure icons, transitions, etc., even when it doesn't make sense (e.g., overlays don't need icons).

### 1.4 SSR Safety

The registry includes a critical safety mechanism:
```typescript
let isRendering = false

export function setAdapter(adapter: FrameworkAdapter): void {
  if (isRendering) {
    throw new Error('[pounce/ui] setAdapter() must be called before component rendering.')
  }
  // ... merge adapter
}

export function getAdapter<T extends ComponentName>(component: T): ComponentAdapter {
  isRendering = true  // Lock adapter after first component render
  return currentAdapter.components?.[component] || {}
}
```

This prevents hydration mismatches in SSR scenarios.

---

## 2. Problems with Current Design

### 2.1 Type Safety Issues

**Problem**: `UiComponents` uses `any` for all component types.

```typescript
// Current - no type checking
setAdapter({
  components: {
    Button: {
      iconResolver: (name) => <Icon name={name} />,  // ✅ Makes sense
      transitions: { duration: 200 }                  // ❌ Buttons don't have transitions
    },
    Dialog: {
      iconResolver: (name) => <Icon name={name} />   // ❌ Dialogs don't use icons
    }
  }
})
```

**Desired**: Each component should define its own `Adaptation` type that only includes relevant configuration.

### 2.2 Decentralized Concerns

**Icon Resolution** is currently per-component:
- `Button` has `iconResolver` logic (`@/home/fmdm/dev/ownk/pounce/packages/ui/src/components/button.tsx:76-90`)
- `RadioButton` duplicates the same logic (`radiobutton.tsx:79-86`)
- Every component with icons must implement the same pattern

**Problem**: Repetitive code, inconsistent behavior, harder to maintain.

**Desired**: Centralize icon handling in the adapter, provide a single `Icon` component.

### 2.3 No Component-Specific Adaptation Types

Components can't express what they need:

```typescript
// What we want:
type ButtonAdaptation = {
  classes?: {
    base?: string
    iconOnly?: string
    // ... other button-specific classes
  }
  iconPlacement?: 'start' | 'end'
  // NO transitions, NO events (button doesn't need them)
}

type DialogAdaptation = {
  classes?: {
    base?: string
    backdrop?: string
    content?: string
  }
  transitions?: TransitionConfig
  // NO iconResolver (dialogs don't use icons)
}
```

---

## 3. Proposed Architecture

### 3.1 Component-Specific Adaptation Types

**Goal**: Replace `any` in `UiComponents` with actual adaptation types.

```typescript
// src/adapter/types.ts

// Base adapter features (common to all components)
export type BaseAdaptation = {
  classes?: Partial<Record<string, string>>
  renderStructure?: (parts: any) => JSX.Element
}

// Component-specific adaptations
export type ButtonAdaptation = BaseAdaptation & {
  iconPlacement?: 'start' | 'end'
}

export type DialogAdaptation = BaseAdaptation & {
  transitions?: TransitionConfig
}

export type OverlayAdaptation = BaseAdaptation & {
  transitions?: TransitionConfig
  backdrop?: boolean
}

// Registry with typed components
export type UiComponents = {
  Button: ButtonAdaptation
  Badge: BaseAdaptation
  Dialog: DialogAdaptation
  ErrorBoundary: BaseAdaptation
  Layout: BaseAdaptation
  Menu: BaseAdaptation
  RadioButton: ButtonAdaptation  // Same as Button
  Toolbar: BaseAdaptation
  Typography: BaseAdaptation
  Heading: BaseAdaptation
  Text: BaseAdaptation
  Link: BaseAdaptation
  // ... more components
}
```

**Benefits**:
- ✅ Type-safe adapter configuration
- ✅ IDE autocomplete for component-specific options
- ✅ Compile-time errors for invalid configurations
- ✅ Self-documenting API

### 3.2 Centralized Icon System

**Goal**: Move icon handling from components to adapter, provide unified `Icon` component.

**New Adapter API**:
```typescript
export type FrameworkAdapter = {
  // Global icon factory (replaces per-component iconResolver)
  iconFactory?: (name: string, size?: string | number) => JSX.Element
  
  // Global variants
  variants?: Record<string, string>
  
  // Per-component adapters (now typed)
  components?: {
    [Name in keyof UiComponents]?: UiComponents[Name]
  }
}
```

**New Icon Component**:
```typescript
// src/components/icon.tsx
import { getAdapter } from '../adapter/registry'

export type IconProps = {
  name: string
  size?: string | number
  el?: JSX.HTMLAttributes<any>
}

export const Icon = (props: IconProps) => {
  const adapter = getAdapter('_global')  // Special key for global config
  const factory = adapter.iconFactory
  
  if (factory) {
    return factory(props.name, props.size)
  }
  
  // Fallback: render icon name as text
  return <span class="pounce-icon" {...props.el}>{props.name}</span>
}
```

**Component Usage** (simplified):
```typescript
// Before (Button component)
const adapter = getAdapter('Button')
const resolver = adapter.iconResolver
const iconElement = resolver ? resolver(s.icon) : s.icon

// After (Button component)
import { Icon } from './icon'

const iconElement = typeof s.icon === 'string' 
  ? <Icon name={s.icon} />
  : s.icon
```

**Adapter Configuration**:
```typescript
// Using pure-glyf
import { Icon as GlyfIcon } from 'pure-glyf'

setAdapter({
  iconFactory: (name, size = 18) => <GlyfIcon icon={name} size={size} />
})

// Using Lucide
import * as LucideIcons from 'lucide-react'

setAdapter({
  iconFactory: (name, size = 18) => {
    const Component = LucideIcons[name]
    return Component ? <Component size={size} /> : <span>{name}</span>
  }
})
```

**Benefits**:
- ✅ Single source of truth for icon rendering
- ✅ No duplication across components
- ✅ Easy to swap icon libraries
- ✅ Consistent icon behavior across all components

### 3.3 Global vs Component-Specific Configuration

Some concerns should be **global** (affect all components), others **component-specific**.

**Global Concerns** (in `FrameworkAdapter` root):
- `iconFactory` - All components use the same icon system
- `variants` - Global variant class mappings
- `transitions` - Could be global defaults (overridable per-component)

**Component-Specific Concerns** (in `components[Name]`):
- `classes` - Component-specific class overrides
- `renderStructure` - Custom DOM structure for specific components
- `iconPlacement` - Where icons appear (Button, RadioButton)
- `transitions` - Component-specific transition overrides (Dialog, Toast)

**Updated Type**:
```typescript
export type FrameworkAdapter = {
  // Global configuration
  iconFactory?: (name: string, size?: string | number) => JSX.Element
  variants?: Record<string, string>
  transitions?: TransitionConfig  // Global defaults
  
  // Per-component configuration (typed)
  components?: {
    [Name in keyof UiComponents]?: UiComponents[Name]
  }
}
```

---

## 4. Migration Strategy

### 4.1 Phase 1: Type System Refactoring

**Goal**: Add typed adaptation interfaces without breaking existing code.

**Tasks**:
1. Define `BaseAdaptation` type
2. Create component-specific adaptation types:
   - `ButtonAdaptation`
   - `DialogAdaptation`
   - `OverlayAdaptation`
   - `LayoutAdaptation`
   - etc.
3. Update `UiComponents` registry to use typed adaptations
4. Update `getAdapter()` return type to be component-specific
5. Verify TypeScript compilation succeeds
6. Run existing tests to ensure no runtime breakage

**Files to Modify**:
- `src/adapter/types.ts` - Add adaptation types
- `src/adapter/registry.ts` - Update `getAdapter()` signature

**Backward Compatibility**: ✅ Existing adapters continue to work (TypeScript will just provide better checking).

### 4.2 Phase 2: Centralized Icon System

**Goal**: Create unified `Icon` component and global `iconFactory`.

**Tasks**:
1. Add `iconFactory` to `FrameworkAdapter` type
2. Create `src/components/icon.tsx` component
3. Update `Button` to use new `Icon` component
4. Update `RadioButton` to use new `Icon` component
5. Remove `iconResolver` from `ComponentAdapter` type (deprecated)
6. Update documentation with migration guide
7. Add deprecation warning for `iconResolver` usage

**Files to Create**:
- `src/components/icon.tsx` - New Icon component

**Files to Modify**:
- `src/adapter/types.ts` - Add `iconFactory`, deprecate `iconResolver`
- `src/components/button.tsx` - Use `Icon` component
- `src/components/radiobutton.tsx` - Use `Icon` component
- Any other components with icon support

**Backward Compatibility**: ⚠️ Breaking change for adapters using `iconResolver`.
- Keep `iconResolver` working with deprecation warning
- Provide migration guide: `iconResolver` → `iconFactory`

### 4.3 Phase 3: Component Adaptation Cleanup

**Goal**: Ensure all components use their typed adaptation interfaces.

**Tasks**:
1. Audit all components for adapter usage
2. Verify each component only uses fields from its adaptation type
3. Remove unused adapter fields from components
4. Add tests for adapter type safety
5. Update component documentation with adaptation options

**Files to Audit**:
- All files in `src/components/`
- Check `getAdapter()` usage in each component

### 4.4 Phase 4: Documentation & Examples

**Goal**: Document the new adapter system and provide examples.

**Tasks**:
1. Update `README.md` with adapter architecture overview
2. Create adapter examples:
   - Pure-glyf icon integration
   - Lucide icon integration
   - Custom icon factory
3. Document each component's adaptation type
4. Create migration guide for existing adapters
5. Add JSDoc comments to adapter types

**Files to Create/Update**:
- `docs/adapters.md` - Comprehensive adapter guide
- `examples/icon-adapters/` - Icon integration examples
- `src/adapter/types.ts` - Add JSDoc comments

---

## 5. Implementation Details

### 5.1 Typed `getAdapter()` Function

**Current**:
```typescript
export function getAdapter<T extends ComponentName>(component: T): ComponentAdapter {
  isRendering = true
  return currentAdapter.components?.[component] || {}
}
```

**Proposed**:
```typescript
export function getAdapter<T extends ComponentName>(
  component: T
): UiComponents[T] {
  isRendering = true
  return (currentAdapter.components?.[component] || {}) as UiComponents[T]
}
```

**Benefit**: Return type is now component-specific.

```typescript
// Before
const adapter = getAdapter('Button')  // Type: ComponentAdapter
adapter.transitions  // ✅ Allowed (but shouldn't be)

// After
const adapter = getAdapter('Button')  // Type: ButtonAdaptation
adapter.transitions  // ❌ TypeScript error - Button doesn't have transitions
adapter.iconPlacement  // ✅ Allowed - Button has iconPlacement
```

### 5.2 Icon Component Implementation

```typescript
// src/components/icon.tsx
import { getGlobalAdapter } from '../adapter/registry'

export type IconProps = {
  name: string
  size?: string | number
  class?: string
  el?: JSX.HTMLAttributes<any>
}

export const Icon = (props: IconProps) => {
  const globalAdapter = getGlobalAdapter()
  
  if (globalAdapter.iconFactory) {
    return globalAdapter.iconFactory(props.name, props.size)
  }
  
  // Fallback: simple text rendering
  return (
    <span 
      class={['pounce-icon', props.class].filter(Boolean).join(' ')}
      {...props.el}
    >
      {props.name}
    </span>
  )
}
```

**New Registry Function**:
```typescript
// src/adapter/registry.ts
export function getGlobalAdapter(): Pick<FrameworkAdapter, 'iconFactory' | 'variants' | 'transitions'> {
  return {
    iconFactory: currentAdapter.iconFactory,
    variants: currentAdapter.variants,
    transitions: currentAdapter.transitions
  }
}
```

### 5.3 Component Adaptation Examples

**Button** (has icons, no transitions):
```typescript
export type ButtonAdaptation = {
  classes?: {
    base?: string
    iconOnly?: string
    [variant: string]: string | undefined
  }
  iconPlacement?: 'start' | 'end'
  renderStructure?: (parts: ComponentParts<ButtonProps>) => JSX.Element
}
```

**Dialog** (has transitions, no icons):
```typescript
export type DialogAdaptation = {
  classes?: {
    base?: string
    backdrop?: string
    content?: string
    header?: string
    footer?: string
  }
  transitions?: TransitionConfig
  renderStructure?: (parts: ComponentParts<DialogProps>) => JSX.Element
}
```

**ErrorBoundary** (minimal adaptation):
```typescript
export type ErrorBoundaryAdaptation = {
  classes?: {
    base?: string
    message?: string
  }
  renderStructure?: (parts: ComponentParts<ErrorBoundaryProps>) => JSX.Element
}
```

**Layout** (no special adaptation):
```typescript
export type LayoutAdaptation = {
  classes?: Record<string, string>
}
```

---

## 6. Testing Strategy

### 6.1 Type Safety Tests

Create TypeScript test files that verify type checking:

```typescript
// tests/types/adapter.test-d.ts
import { setAdapter } from '../../src/adapter'
import { expectType, expectError } from 'tsd'

// ✅ Valid adapter configuration
setAdapter({
  iconFactory: (name) => <span>{name}</span>,
  components: {
    Button: {
      iconPlacement: 'start'  // ✅ Valid
    }
  }
})

// ❌ Invalid adapter configuration
setAdapter({
  components: {
    Button: {
      transitions: { duration: 200 }  // ❌ Should error - Button doesn't have transitions
    }
  }
})
```

### 6.2 Runtime Tests

Update existing adapter tests:

```typescript
// tests/unit/adapter.spec.ts
describe('Typed Adapter Registry', () => {
  it('provides component-specific adapter types', () => {
    setAdapter({
      components: {
        Button: {
          iconPlacement: 'end'
        }
      }
    })
    
    const buttonAdapter = getAdapter('Button')
    expect(buttonAdapter.iconPlacement).toBe('end')
  })
  
  it('supports global icon factory', () => {
    const mockFactory = vi.fn((name) => <span>{name}</span>)
    
    setAdapter({
      iconFactory: mockFactory
    })
    
    const globalAdapter = getGlobalAdapter()
    expect(globalAdapter.iconFactory).toBe(mockFactory)
  })
})
```

### 6.3 Component Integration Tests

Test that components use the new Icon system:

```typescript
// tests/unit/button-icon.spec.tsx
describe('Button Icon Integration', () => {
  it('uses global icon factory', () => {
    setAdapter({
      iconFactory: (name) => <span class="custom-icon">{name}</span>
    })
    
    const { container } = render(<Button icon="check">Save</Button>)
    
    expect(container.querySelector('.custom-icon')).toBeTruthy()
    expect(container.textContent).toContain('check')
  })
  
  it('accepts JSX icon elements', () => {
    const { container } = render(
      <Button icon={<svg class="my-icon" />}>Save</Button>
    )
    
    expect(container.querySelector('.my-icon')).toBeTruthy()
  })
})
```

---

## 7. Breaking Changes & Migration

### 7.1 Breaking Changes

**For Adapter Authors**:

1. **`iconResolver` → `iconFactory`** (per-component → global)
   ```typescript
   // Before
   setAdapter({
     components: {
       Button: {
         iconResolver: (name) => <Icon name={name} />
       }
     }
   })
   
   // After
   setAdapter({
     iconFactory: (name) => <Icon name={name} />
   })
   ```

2. **Type checking enforced** (invalid configurations will error)
   ```typescript
   // Before (no error)
   setAdapter({
     components: {
       Button: {
         transitions: { duration: 200 }  // Silently ignored
       }
     }
   })
   
   // After (TypeScript error)
   setAdapter({
     components: {
       Button: {
         transitions: { duration: 200 }  // ❌ Type error
       }
     }
   })
   ```

### 7.2 Migration Guide

**Step 1**: Update adapter configuration
- Move `iconResolver` from component-specific to global `iconFactory`
- Remove invalid configuration options (TypeScript will guide you)

**Step 2**: Test your adapter
- Run TypeScript compilation
- Run unit tests
- Verify visual appearance

**Step 3**: Update documentation
- Document your adapter's configuration
- Provide examples for icon integration

### 7.3 Deprecation Timeline

- **v1.x**: Current system (no breaking changes)
- **v2.0**: Add typed adaptations, `iconFactory`, deprecate `iconResolver`
- **v2.1-2.5**: Keep `iconResolver` with deprecation warnings
- **v3.0**: Remove `iconResolver` entirely

---

## 8. Benefits Summary

### 8.1 Type Safety
- ✅ Component-specific adaptation types
- ✅ Compile-time validation
- ✅ IDE autocomplete
- ✅ Self-documenting API

### 8.2 Maintainability
- ✅ Centralized icon handling
- ✅ No code duplication
- ✅ Single source of truth
- ✅ Easier to add new components

### 8.3 Developer Experience
- ✅ Clear API boundaries
- ✅ Better error messages
- ✅ Easier adapter creation
- ✅ Consistent behavior

### 8.4 Performance
- ✅ No runtime overhead (types erased at compile time)
- ✅ Same SSR safety guarantees
- ✅ No additional bundle size

---

## 9. Open Questions

### 9.1 Icon Component Export

**Question**: Should `Icon` be exported from main `@pounce/ui` entry?

**Options**:
- **A**: Export as public component (users can use `<Icon name="check" />`)
- **B**: Keep internal (only used by other components)

**Recommendation**: **Option A** - Export as public component. Useful for custom layouts and one-off icons.

### 9.2 Adapter Validation

**Question**: Should we validate adapter configuration at runtime?

**Options**:
- **A**: TypeScript-only validation (compile-time)
- **B**: Runtime validation with helpful errors (dev mode only)

**Recommendation**: **Option B** - Add dev-mode validation to catch configuration errors early.

```typescript
if (process.env.NODE_ENV !== 'production') {
  validateAdapter(adapter)  // Throws helpful errors for invalid config
}
```

### 9.3 Backward Compatibility

**Question**: How long should we support `iconResolver`?

**Options**:
- **A**: Remove immediately (v2.0)
- **B**: Deprecate with warnings (v2.x), remove in v3.0
- **C**: Keep forever (no removal)

**Recommendation**: **Option B** - Deprecate with clear migration path, remove in major version.

---

## 10. Next Steps

### 10.1 Immediate Actions

1. **Review this document** with team/maintainer
2. **Decide on open questions** (Icon export, validation, backward compat)
3. **Create implementation tasks** in WALKTHROUGH.md
4. **Assign ownership** for each phase

### 10.2 Implementation Order

1. **Phase 1**: Type system refactoring (non-breaking)
2. **Phase 2**: Centralized Icon system (breaking, but with fallback)
3. **Phase 3**: Component cleanup (internal refactoring)
4. **Phase 4**: Documentation (user-facing)

### 10.3 Success Criteria

- ✅ All components use typed adaptations
- ✅ Icon handling centralized in adapter
- ✅ No code duplication across components
- ✅ TypeScript compilation succeeds
- ✅ All tests pass
- ✅ Documentation updated
- ✅ Migration guide provided

---

## Appendix A: Current Component Inventory

Components with icon support (need Icon refactoring):
- `Button` - Uses `iconResolver`
- `RadioButton` - Uses `iconResolver`
- `Menu` - May use icons in menu items
- `Toolbar` - May use icons in toolbar items

Components with transitions (need typed adaptations):
- `Dialog` - Has transition config
- `Toast` - Has transition config
- `Drawer` - Has transition config
- `Alert` - May have transitions

Components with minimal adaptation needs:
- `ErrorBoundary` - Only classes
- `Layout` - Only classes
- `Typography` - Only classes + variants
- `Badge` - Only classes + variants

---

## Appendix B: Example Adapter Configurations

### Pure-glyf Adapter

```typescript
import { Icon as GlyfIcon } from 'pure-glyf'
import { setAdapter } from '@pounce/ui'

setAdapter({
  iconFactory: (name, size = 18) => (
    <GlyfIcon icon={name} size={size} />
  ),
  variants: {
    primary: 'pounce-variant-primary',
    danger: 'pounce-variant-danger'
  }
})
```

### Lucide Adapter

```typescript
import * as LucideIcons from 'lucide-react'
import { setAdapter } from '@pounce/ui'

setAdapter({
  iconFactory: (name, size = 18) => {
    const IconComponent = LucideIcons[name]
    if (!IconComponent) {
      console.warn(`Icon "${name}" not found in Lucide`)
      return <span>{name}</span>
    }
    return <IconComponent size={size} />
  }
})
```

### PicoCSS Adapter

```typescript
import '@picocss/pico/css/pico.min.css'
import { setAdapter } from '@pounce/ui'

setAdapter({
  variants: {
    primary: 'pico-button-primary',
    secondary: 'pico-button-secondary'
  },
  components: {
    Button: {
      classes: {
        base: 'pico-button'
      }
    }
  }
})
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-04  
**Author**: Cascade  
**Status**: Draft - Awaiting Review

# Icon System: Separate Configuration vs Adapter Integration

## Problem Statement

Currently, `iconFactory` is part of the `FrameworkAdapter`. This creates coupling between:
1. **Framework styling** (Pico, Tailwind, etc.)
2. **Icon library** (Heroicon, Pure-glyf, Lucide, etc.)

However, these are **orthogonal concerns**:
- You might want `pico + heroicon` OR `pico + pureglyf`
- You might want `tailwind + heroicon` OR `tailwind + pureglyf`

## Option 1: Current Implementation (Monolithic Adapter)

```typescript
// Icons are part of the adapter
setAdapter({
  iconFactory: (name) => <GlyfIcon name={name} />,
  variants: { primary: 'pico-primary' },
  components: { Button: { classes: { base: 'pico-btn' } } }
})
```

**Pros**:
- Single configuration point
- Simple API

**Cons**:
- Couples framework and icons
- Can't easily swap icon libraries without changing adapter
- Adapter packages must choose an icon library

## Option 2: Separate Configuration Points

```typescript
// Configure icons separately
setIcons((name) => <GlyfIcon name={name} />)

// Configure framework adapter
setAdapter({
  variants: { primary: 'pico-primary' },
  components: { Button: { classes: { base: 'pico-btn' } } }
})
```

**Pros**:
- Clear separation of concerns
- Easy to swap icon libraries independently
- Adapter packages don't need to choose icons

**Cons**:
- Two configuration points
- More API surface

## Option 3: Composable Adapters (Recommended)

Allow multiple `setAdapter()` calls that **merge** configurations:

```typescript
// Icon adapter
setAdapter({
  iconFactory: (name) => <GlyfIcon name={name} />
})

// Framework adapter
setAdapter({
  variants: { primary: 'pico-primary' },
  components: { Button: { classes: { base: 'pico-btn' } } }
})

// Or compose them
const picoAdapter = { variants: {...}, components: {...} }
const glyfAdapter = { iconFactory: (name) => <GlyfIcon name={name} /> }

setAdapter(picoAdapter)
setAdapter(glyfAdapter)  // Merges with previous
```

**Implementation**: Use `Object.create()` or prototype chain to compose adapters:

```typescript
let currentAdapter: FrameworkAdapter = { components: {} }

export function setAdapter(adapter: Partial<FrameworkAdapter>): void {
  if (isRendering) {
    throw new Error('[pounce/ui] setAdapter() must be called before component rendering.')
  }
  
  validateAdapter(adapter)
  
  // Deep merge - allows multiple calls
  currentAdapter = {
    iconFactory: adapter.iconFactory ?? currentAdapter.iconFactory,
    variants: { ...currentAdapter.variants, ...adapter.variants },
    transitions: adapter.transitions ?? currentAdapter.transitions,
    components: { ...currentAdapter.components, ...adapter.components }
  }
}
```

**Pros**:
- Single API (`setAdapter`)
- Separation of concerns via composition
- Can create reusable adapter "plugins"
- Supports multiple sources (framework + icons + custom)
- Backward compatible

**Cons**:
- Merge order matters (last wins for iconFactory/transitions)
- Need to document composition pattern

## Option 4: Explicit Adapter Composition

```typescript
// Create composable adapter pieces
const picoAdapter = createAdapter({
  variants: { primary: 'pico-primary' },
  components: { Button: { classes: { base: 'pico-btn' } } }
})

const glyfAdapter = createAdapter({
  iconFactory: (name) => <GlyfIcon name={name} />
})

// Compose them explicitly
setAdapter(composeAdapters(picoAdapter, glyfAdapter))

// Or use spread
setAdapter({ ...picoAdapter, ...glyfAdapter })
```

## Recommendation: Option 3 (Composable Adapters)

**Why**:
1. **Separation of concerns**: Icons, framework, and custom configs are separate
2. **Simple API**: Still just `setAdapter()`, but accepts `Partial<FrameworkAdapter>`
3. **Flexible**: Users can compose however they want
4. **Package ecosystem**: Enables packages like:
   - `@pounce/ui-pico` - Framework adapter
   - `@pounce/ui-icons-glyf` - Icon adapter
   - `@pounce/ui-icons-heroicon` - Icon adapter
   - Users mix and match: `setAdapter(picoAdapter); setAdapter(glyfAdapter)`

**Implementation Changes**:

1. Change signature to accept `Partial<FrameworkAdapter>`
2. Document composition pattern
3. Keep current deep merge logic (already supports this!)

```typescript
// types.ts
export type FrameworkAdapter = {
  iconFactory?: (name: string, size?: string | number) => JSX.Element
  variants?: Record<string, string>
  transitions?: TransitionConfig
  components?: {
    [Name in keyof UiComponents]?: UiComponents[Name]
  }
}

// Already accepts Partial! Just need to document it
export function setAdapter(adapter: FrameworkAdapter): void {
  // Current implementation already merges correctly
}
```

## Example Usage

```typescript
// User code
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/ui-pico'
import { glyfIcons } from '@pounce/ui-icons-glyf'

// Compose adapters
setAdapter(picoAdapter)
setAdapter(glyfIcons)

// Or inline
setAdapter({
  iconFactory: (name) => <MyCustomIcon name={name} />
})
```

## Migration Path

Current implementation already supports this! We just need to:
1. ✅ Change type to `Partial<FrameworkAdapter>` (for clarity)
2. ✅ Document composition pattern
3. ✅ Create example adapter packages showing separation

No breaking changes needed - the current implementation already merges correctly.

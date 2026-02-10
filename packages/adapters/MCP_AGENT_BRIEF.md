# MCP Agent Brief - Pounce UI Adapter Development

## Mission

Develop adapter packages for `@pounce/ui` that provide framework-specific styling, icons, and transitions. Each adapter should be composable and follow the orthogonal concerns architecture.

## Key Documentation

Please read these files to understand the architecture:

1. **Adapter Architecture**
   - `/home/fmdm/dev/ownk/pounce/packages/ui/analysis/adapter-factoring.md`
   - Complete refactoring plan and implementation status

2. **Orthogonal Concerns**
   - `/home/fmdm/dev/ownk/pounce/packages/ui/analysis/orthogonal-concerns.md`
   - Analysis of the 4 adapter concerns (icons, variants, components, transitions)

3. **Display Context**
   - `/home/fmdm/dev/ownk/pounce/packages/ui/analysis/display-context-architecture.md`
   - Scope-based theme/direction/locale system (separate from adapters)

4. **Package Structure**
   - `/home/fmdm/dev/ownk/pounce/packages/ui/analysis/adapter-packages-structure.md`
   - Folder structure and naming conventions

5. **Type Definitions**
   - `/home/fmdm/dev/ownk/pounce/packages/ui/src/adapter/types.ts`
   - `FrameworkAdapter`, `Trait`, `DisplayContext` types

6. **Trait System**
   - `/home/fmdm/dev/ownk/pounce/packages/core/src/lib/traits.md`
   - Understanding Trait objects (classes + styles + attributes)

## Current Tasks

### Priority 1: Create `@pounce/adapter-pico`

**Goal**: Framework adapter for PicoCSS

**Steps**:
1. Read PicoCSS source to understand:
   - Variant classes (primary, secondary, contrast, etc.)
   - Component structure (buttons, forms, etc.)
   - Transition/animation classes

2. Create package structure:
   ```
   packages/adapters/pico/
   ├── src/
   │   ├── index.ts           # Export picoAdapter
   │   ├── variants.ts        # Trait definitions for variants
   │   ├── components.ts      # Component-specific configs
   │   └── transitions.ts     # Transition configs (if any)
   ├── package.json
   ├── tsconfig.json
   └── README.md
   ```

3. Map PicoCSS variants to Trait objects:
   ```typescript
   import type { Trait } from '@pounce/core'
   
   export const variants: Record<string, Trait> = {
     primary: {
       classes: ['pico-button-primary'],
       attributes: { 'data-variant': 'primary' }
     },
     danger: {
       classes: ['pico-button-danger'],
       attributes: { 
         'data-variant': 'danger',
         'aria-live': 'polite'  // A11y for dangerous actions
       }
     }
     // ... more variants
   }
   ```

4. Export adapter:
   ```typescript
   import type { FrameworkAdapter } from '@pounce/ui'
   import { variants } from './variants'
   import { components } from './components'
   
   export const picoAdapter: Partial<FrameworkAdapter> = {
     variants,
     components
   }
   ```

### Priority 2: Create `@pounce/adapter-icons-glyf`

**Goal**: Icon adapter for Pure-glyf

**Steps**:
1. Read Pure-glyf source to understand icon component API

2. Create package structure (same as above)

3. Implement context-aware iconFactory:
   ```typescript
   import type { FrameworkAdapter, DisplayContext } from '@pounce/ui'
   import { Icon as GlyfIcon } from 'pure-glyf'
   
   export const glyfIcons: Partial<FrameworkAdapter> = {
     iconFactory: (name: string, size: string | number | undefined, context: DisplayContext) => {
       // Use context for theme-aware icons
       const variant = context.theme === 'dark' ? 'light' : 'dark'
       
       // TODO: Handle RTL mirroring for directional icons
       // const iconName = context.direction === 'rtl' && isDirectional(name)
       //   ? mirrorIcon(name)
       //   : name
       
       return <GlyfIcon name={name} size={size} variant={variant} />
     }
   }
   ```

## Important Constraints

1. **Trait Objects**: Variants MUST use `Trait` objects from `@pounce/core`, not plain strings
   ```typescript
   // ❌ Wrong
   variants: { primary: 'pico-primary' }
   
   // ✅ Correct
   variants: { 
     primary: { 
       classes: ['pico-primary'],
       attributes: { 'data-variant': 'primary' }
     } 
   }
   ```

2. **Context-Aware Functions**: `iconFactory` and `renderStructure` receive `DisplayContext`
   ```typescript
   iconFactory: (name, size, context) => {
     // Use context.theme, context.direction, context.locale
   }
   ```

3. **Composability**: Adapters should be partial - they can provide only some concerns
   ```typescript
   // Valid - only provides icons
   export const glyfIcons: Partial<FrameworkAdapter> = {
     iconFactory: (name, size, context) => <Icon name={name} />
   }
   ```

4. **No Display Concerns**: Don't include theme/direction/locale in adapters - those are in DisplayContext

## Testing

Each adapter should include:
- Unit tests for Trait definitions
- Integration tests with `@pounce/ui` components
- Examples showing composition with other adapters

## Questions?

Ask in this MCP-IRC channel. Reference the documentation files above for detailed architecture information.

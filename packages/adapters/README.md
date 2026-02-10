# Pounce UI Adapters

This directory contains adapter packages for `@pounce/ui` that provide framework-specific styling, icons, and transitions.

## Architecture

Adapters are **composable** - you can mix and match different adapters for different concerns:

```typescript
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'
import { glyfIcons } from '@pounce/adapter-icons-glyf'

// Compose adapters
setAdapter(picoAdapter)    // Framework styling
setAdapter(glyfIcons)      // Icon library
```

## Orthogonal Concerns

Each adapter can fulfill one or more orthogonal concerns:

1. **Icons** - Icon rendering system (`iconFactory`)
2. **Variants** - Styling + A11y via Trait system (`variants`)
3. **Components** - Per-component structure + classes (`components`)
4. **Transitions** - Animation system (`transitions`)

Display concerns (theme, direction, locale) are handled separately via `DisplayContext`, not adapters.

## Available Adapters

### Framework Adapters
- `@pounce/adapter-pico` - PicoCSS framework styling

### Icon Adapters
- `@pounce/adapter-icons-glyf` - Pure-glyf icon library

### Future Adapters
- `@pounce/adapter-tailwind` - Tailwind CSS framework
- `@pounce/adapter-icons-heroicon` - Heroicons
- `@pounce/adapter-icons-lucide` - Lucide icons
- `@pounce/adapter-transitions-tailwind` - Tailwind transitions

## Documentation

See `/packages/ui/analysis/` for detailed architecture documentation:
- `adapter-factoring.md` - Adapter refactoring plan and implementation
- `orthogonal-concerns.md` - Analysis of adapter concerns
- `display-context-architecture.md` - Display context (theme/direction/locale)
- `adapter-packages-structure.md` - Package structure and naming conventions

## Creating an Adapter

Each adapter package should:

1. Export a partial `FrameworkAdapter` object
2. Use `Trait` objects for variants (classes + ARIA roles)
3. Provide context-aware functions (iconFactory receives DisplayContext)
4. Include TypeScript types and documentation

Example structure:
```
packages/adapters/my-adapter/
├── src/
│   ├── index.ts           # Export adapter
│   ├── variants.ts        # Trait definitions
│   ├── components.ts      # Component configs
│   └── transitions.ts     # Transition configs
├── package.json
├── tsconfig.json
└── README.md
```

## MCP Agent Development

Adapters are developed with assistance from an MCP agent that:
- Reads framework source code (PicoCSS, Tailwind, etc.)
- Generates accurate Trait mappings
- Validates adapter configurations
- Keeps adapters synchronized with framework updates

# Adapter Packages - Structure and Naming

## Folder Structure Options

### Option 1: Flat in `packages/` (Current Pattern)
```
pounce/
├── packages/
│   ├── core/
│   ├── ui/
│   ├── kit/
│   ├── board/
│   ├── pico/
│   ├── plugin/
│   ├── adapter-pico/          ← New
│   ├── adapter-tailwind/      ← New
│   ├── adapter-icons-glyf/    ← New
│   └── adapter-icons-heroicon/← New
```

**Pros**: 
- Consistent with current structure
- Simple, flat hierarchy
- Each package is independent

**Cons**:
- Many packages at root level
- Harder to distinguish adapters from core packages
- No grouping by concern

### Option 2: Grouped in `packages/adapters/`
```
pounce/
├── packages/
│   ├── core/
│   ├── ui/
│   ├── kit/
│   ├── board/
│   ├── pico/
│   ├── plugin/
│   └── adapters/
│       ├── pico/
│       ├── tailwind/
│       ├── icons-glyf/
│       └── icons-heroicon/
```

**Pros**:
- Clear grouping of adapter packages
- Cleaner root packages/ directory
- Easy to find all adapters

**Cons**:
- Nested structure (packages/adapters/pico)
- Requires workspace configuration
- Different from current flat pattern

### Option 3: Separate `adapters/` at root
```
pounce/
├── packages/
│   ├── core/
│   ├── ui/
│   ├── kit/
│   └── ...
└── adapters/
    ├── pico/
    ├── tailwind/
    ├── icons-glyf/
    └── icons-heroicon/
```

**Pros**:
- Clear separation: core packages vs adapters
- Adapters are optional, structure reflects this
- Easy to exclude from certain operations

**Cons**:
- Breaks monorepo convention (everything in packages/)
- Requires workspace configuration update
- Two top-level directories to manage

## Package Naming Options

### Option A: `@pounce/adapter-*` (Flat Naming)
```
@pounce/adapter-pico
@pounce/adapter-tailwind
@pounce/adapter-icons-glyf
@pounce/adapter-icons-heroicon
```

**Pros**:
- Works with any folder structure
- Clear npm package names
- Standard npm naming convention

**Cons**:
- Long package names
- No namespace grouping in npm

### Option B: `@pounce/adapter/*` (Scoped Subpath)
```
@pounce/adapter/pico
@pounce/adapter/tailwind
@pounce/adapter/icons-glyf
@pounce/adapter/icons-heroicon
```

**Pros**:
- Cleaner package names
- Grouped under `@pounce/adapter` namespace
- Shorter imports

**Cons**:
- **Not standard npm convention** - subpaths are for exports, not package names
- May confuse npm/pnpm tooling
- Harder to publish separately

### Option C: Separate Scopes by Type
```
@pounce/pico          (framework adapter)
@pounce/tailwind      (framework adapter)
@pounce-icons/glyf    (icon adapter)
@pounce-icons/heroicon(icon adapter)
```

**Pros**:
- Very clean names
- Separate scopes for different concerns
- Easy to understand purpose

**Cons**:
- Multiple npm scopes to manage
- Inconsistent with current @pounce scope
- May fragment ecosystem

## Recommendation

### Folder Structure: **Option 2** - `packages/adapters/`

```
pounce/
├── packages/
│   ├── core/
│   ├── ui/
│   ├── kit/
│   ├── board/
│   ├── pico/
│   ├── plugin/
│   └── adapters/
│       ├── pico/          → @pounce/adapter-pico
│       ├── tailwind/      → @pounce/adapter-tailwind
│       ├── icons-glyf/    → @pounce/adapter-icons-glyf
│       └── icons-heroicon/→ @pounce/adapter-icons-heroicon
```

**Rationale**:
- Clear grouping without breaking monorepo conventions
- Keeps packages/ as single source of truth
- Easy to find and manage all adapters
- Scales well as more adapters are added

### Package Naming: **Option A** - `@pounce/adapter-*`

```
@pounce/adapter-pico
@pounce/adapter-tailwind
@pounce/adapter-icons-glyf
@pounce/adapter-icons-heroicon
```

**Rationale**:
- Standard npm naming convention
- Works with all tooling
- Clear and explicit
- Consistent with @pounce scope

### Usage Example

```typescript
// Install
npm i @pounce/ui @pounce/adapter-pico @pounce/adapter-icons-glyf

// Import
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'
import { glyfIcons } from '@pounce/adapter-icons-glyf'

// Use
setAdapter(picoAdapter)
setAdapter(glyfIcons)
```

## Implementation

### 1. Update `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  - 'packages/adapters/*'  # Add this line
```

### 2. Create Adapter Package Structure

```
packages/adapters/pico/
├── src/
│   ├── index.ts           # Export picoAdapter
│   ├── variants.ts        # Trait definitions
│   ├── components.ts      # Component-specific configs
│   └── transitions.ts     # Transition configs
├── package.json           # name: "@pounce/adapter-pico"
├── tsconfig.json
└── README.md
```

### 3. Package.json Template

```json
{
  "name": "@pounce/adapter-pico",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "peerDependencies": {
    "@pounce/ui": "workspace:*",
    "@pounce/core": "workspace:*"
  },
  "dependencies": {
    "@picocss/pico": "^2.0.0"
  }
}
```

## Adapter Categories

### Framework Adapters
- `@pounce/adapter-pico` - PicoCSS framework
- `@pounce/adapter-tailwind` - Tailwind CSS framework
- `@pounce/adapter-bootstrap` - Bootstrap framework

### Icon Adapters
- `@pounce/adapter-icons-glyf` - Pure-glyf icons
- `@pounce/adapter-icons-heroicon` - Heroicons
- `@pounce/adapter-icons-lucide` - Lucide icons

### Transition Adapters (Future)
- `@pounce/adapter-transitions-tailwind` - Tailwind transitions
- `@pounce/adapter-transitions-framer` - Framer Motion

### Combined Adapters (Future)
- `@pounce/adapter-pico-complete` - Pico + Pure-glyf + transitions (batteries included)

## Next Steps

1. Create `packages/adapters/` directory
2. Update `pnpm-workspace.yaml`
3. Create first adapter: `@pounce/adapter-pico`
4. Create second adapter: `@pounce/adapter-icons-glyf`
5. Test composition pattern
6. Document adapter creation guide for community

# @pounce/plugin

Centralized plugin hub for Pounce build-time transformations.

## Overview

This package provides all build-time plugins and configurations for the Pounce framework. It separates build-time concerns from runtime packages, ensuring clean dependency management and preventing accidental bundling of build tools.

## Exports

- `@pounce/plugin/core` - Core JSX transformation plugin (Babel)
- `@pounce/plugin/ui` - UI styling plugin (SASS/CSS layer wrapping)
- `@pounce/plugin/kit` - Kit build utilities
- `@pounce/plugin/configs` - Shared build configurations (vite-plugin-dts, babel configs)
- `@pounce/plugin/packages` - Predefined plugin combinations

## Installation

```bash
pnpm add -D @pounce/plugin
```

## Usage

### Individual Plugins

```typescript
// vite.config.ts
import { pounceBabelPlugin } from '@pounce/plugin/core'
import { pounceUIPlugin } from '@pounce/plugin/ui'

export default defineConfig({
  plugins: [
    pounceBabelPlugin(),
    pounceUIPlugin()
  ]
})
```

### Plugin Packages (Recommended)

Plugin packages provide predefined combinations for common use cases:

#### Core Package
For libraries that need reactive JSX but no UI styling:

```typescript
import { pounceCorePackage } from '@pounce/plugin/packages'

export default defineConfig({
  plugins: [
    ...pounceCorePackage({
      core: {
        jsxRuntime: { runtime: 'automatic', importSource: '@pounce/core' },
        onlyRemoveTypeImports: true
      },
      dts: { 
        insertTypesEntry: true,
        // Optional: Custom beforeWriteFile hook for special type handling
        beforeWriteFile: (filePath, content) => {
          if (filePath.endsWith('dist/index.d.ts')) {
            const reference = '/// <reference path="./types/jsx.d.ts" />\n'
            if (!content.includes(reference)) {
              return { filePath, content: reference + content }
            }
          }
          return { filePath, content }
        }
      }
    })
  ]
})
```

#### UI Package
For UI component libraries that need styling validation:

```typescript
import { pounceUIPackage } from '@pounce/plugin/packages'

export default defineConfig({
  plugins: [
    ...pounceUIPackage({
      ui: {
        core: { /* core options */ },
        dts: { /* dts options */ }
      }
    })
  ]
})
```

#### Client Package
For client applications that need everything:

```typescript
import { pounceClientPackage } from '@pounce/plugin/packages'

export default defineConfig({
  plugins: [
    ...pounceClientPackage({
      client: {
        ui: { /* ui options */ }
      },
      additional: [
        // Additional plugins for client apps
        viteSinglePage()
      ]
    })
  ]
})
```

#### Minimal Package
For simple projects that only need reactive JSX:

```typescript
import { pounceMinimalPackage } from '@pounce/plugin/packages'

export default defineConfig({
  plugins: [
    ...pounceMinimalPackage({
      jsxRuntime: { runtime: 'automatic', importSource: '@pounce/core' }
    })
  ]
})
```

## Status

**Version**: 0.0.0 (Phase 1 - Plugin Migration)

This package is currently in Phase 1 of the plugin standardization roadmap. Core/UI plugin implementations and shared configs now live here.

## Tests

```bash
pnpm -C packages/plugin test
```

Current coverage includes:
- Core Babel plugin: Object.assign → compose transform + utils import
- UI plugin: layer wrapping + forbidden variable validation

## Architecture

All plugins are build-time only and should be installed as `devDependencies`. Runtime packages (`@pounce/core`, `@pounce/ui`, etc.) provide global type declarations, while this package handles the build-time transformations.

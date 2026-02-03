# @pounce/ui Build & Test Specification

This document specifies the build pipeline, test infrastructure, and SASS/SCSS setup for `@pounce/ui`.

## 🎯 Build Goals

1. **Dual CSS Output**: Generate both light and dark theme CSS files
2. **SASS/SCSS Source**: All styles written in SCSS (indented syntax preferred)
3. **Component Co-location**: Styles live with components via `css`/`sass` tagged templates
4. **CSS Layers**: Output uses `@layer pounce.base` and `@layer pounce.components`
5. **Tree-shakeable**: Only import components you use
6. **SSR-ready**: Works with both DOM and Node entry points

## 📦 Build Pipeline Architecture

### Input Sources

```
src/
├── styles/
│   ├── _variables.scss          # CSS variable definitions
│   ├── _layers.scss              # @layer declarations
│   ├── themes/
│   │   ├── _light.scss           # Light theme variables
│   │   └── _dark.scss            # Dark theme variables
│   └── index.scss                # Main entry (light theme)
│   └── dark.scss                 # Dark theme entry
├── components/
│   ├── button.tsx                # Component with inline styles
│   ├── dialog.tsx
│   └── ...
└── index.ts                      # Main export
```

### Output Structure

```
dist/
├── index.js                      # ESM bundle (components)
├── index.d.ts                    # TypeScript declarations
├── ui.css                        # Light theme CSS
└── ui-dark.css                   # Dark theme CSS
```

## 🔧 Build Configuration

### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "npm run build:js && npm run build:css",
    "build:js": "vite build",
    "build:css": "npm run build:css:light && npm run build:css:dark",
    "build:css:light": "sass src/styles/index.scss dist/ui.css --style=compressed --no-source-map",
    "build:css:dark": "sass src/styles/dark.scss dist/ui-dark.css --style=compressed --no-source-map",
    "type-check": "tsc --noEmit",
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PounceUI',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        '@pounce/core',
        '@pounce/kit',
        'mutts',
        'dockview-core',
        'pure-glyf'
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src'
      }
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true
    })
  ]
})
```

### tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "jsx": "preserve",
    "jsxImportSource": "@pounce/core"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 🎨 SASS/SCSS Structure

### Why SCSS (Indented Syntax)?

- **Cleaner**: No braces, semicolons (Python-like as requested)
- **Readable**: Indentation-based structure
- **Maintainable**: Less visual noise

### File Organization

#### src/styles/_layers.scss
```scss
// Declare layer order upfront
@layer pounce.base, pounce.components
```

#### src/styles/_variables.scss
```scss
// Base CSS variables (used by both themes)
@layer pounce.base
  :root
    // Colors
    --pounce-primary: #3b82f6
    --pounce-secondary: #64748b
    --pounce-contrast: #0f172a
    
    // Semantic colors
    --pounce-success: #15803d
    --pounce-warning: #f59e0b
    --pounce-danger: #b91c1c
    
    // Layout
    --pounce-spacing: 1rem
    --pounce-border-radius: 0.5rem
    --pounce-form-height: 2.5rem
    
    // Backgrounds & borders
    --pounce-bg: #fff
    --pounce-card-bg: #fff
    --pounce-fg: #000
    --pounce-border: rgba(0, 0, 0, 0.2)
    --pounce-muted: #888
    --pounce-muted-border: rgba(0, 0, 0, 0.2)
```

#### src/styles/themes/_light.scss
```scss
// Light theme overrides (if any)
@layer pounce.base
  :root
    // Most variables already defined in _variables.scss
    // Only override if light theme needs different values
```

#### src/styles/themes/_dark.scss
```scss
// Dark theme overrides
@layer pounce.base
  :root
    --pounce-bg: #1a1a1a
    --pounce-card-bg: #2a2a2a
    --pounce-fg: #fff
    --pounce-border: rgba(255, 255, 255, 0.2)
    --pounce-muted: #aaa
    --pounce-muted-border: rgba(255, 255, 255, 0.2)
```

#### src/styles/index.scss (Light Theme Entry)
```scss
@use 'layers'
@use 'variables'
@use 'themes/light'

// Component styles are injected here by Vite
// via css/sass tagged templates from components
```

#### src/styles/dark.scss (Dark Theme Entry)
```scss
@use 'layers'
@use 'variables'
@use 'themes/dark'

// Component styles are injected here by Vite
// via css/sass tagged templates from components
```

### Component Inline Styles

Components use tagged templates from `@pounce/kit/entry-dom`:

```typescript
import { sass } from '@pounce/kit/entry-dom'

sass`
@layer pounce.components
  .pounce-button
    display: inline-flex
    align-items: center
    gap: 0.5rem
    padding: 0.5rem 1rem
    border-radius: var(--pounce-border-radius)
    background: var(--pounce-primary)
    color: white
    border: none
    cursor: pointer
    
    &:hover
      filter: brightness(0.9)
    
    &:disabled
      opacity: 0.5
      cursor: not-allowed
`

export const Button = (props) => {
  // Component implementation
}
```

**Key Points:**
- Always wrap in `@layer pounce.components`
- Use indented SCSS syntax (no braces/semicolons)
- Reference `--pounce-*` variables only
- Styles are extracted at build time by Vite

## 🧪 Test Infrastructure

### Test Structure

```
tests/
├── unit/
│   ├── adapter.spec.ts           # Adapter registry tests
│   ├── button.spec.ts            # Component unit tests
│   └── ...
├── e2e/
│   ├── button.test.ts            # Playwright e2e tests
│   └── ...
├── helpers/
│   ├── a11y.ts                   # Accessibility test utilities
│   └── render.ts                 # Test render utilities
└── setup-mutts.ts                # Test setup
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup-mutts.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/'
      ]
    }
  }
})
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Test Utilities

#### tests/helpers/render.ts
```typescript
import { bindApp } from '@pounce/core'

export function render(component: JSX.Element, container?: HTMLElement) {
  const target = container || document.createElement('div')
  document.body.appendChild(target)
  
  const cleanup = bindApp(component, target)
  
  return {
    container: target,
    cleanup: () => {
      cleanup()
      target.remove()
    }
  }
}
```

#### tests/helpers/a11y.ts
```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

export async function testAccessibility(page: Page) {
  await injectAxe(page)
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: {
      html: true
    }
  })
}
```

## 📋 Build Checklist

### Phase 0 Implementation Tasks

- [ ] Install dependencies:
  ```bash
  npm install -D sass vite vite-plugin-dts vitest @vitest/ui jsdom
  npm install -D @playwright/test axe-playwright
  ```

- [ ] Create directory structure:
  ```bash
  mkdir -p src/styles/themes
  mkdir -p tests/{unit,e2e,helpers}
  ```

- [ ] Create SCSS files:
  - [ ] `src/styles/_layers.scss`
  - [ ] `src/styles/_variables.scss`
  - [ ] `src/styles/themes/_light.scss`
  - [ ] `src/styles/themes/_dark.scss`
  - [ ] `src/styles/index.scss`
  - [ ] `src/styles/dark.scss`

- [ ] Create config files:
  - [ ] `vite.config.ts`
  - [ ] `vitest.config.ts`
  - [ ] `playwright.config.ts`
  - [ ] `tsconfig.json`

- [ ] Create test utilities:
  - [ ] `tests/helpers/render.ts`
  - [ ] `tests/helpers/a11y.ts`
  - [ ] `tests/setup-mutts.ts`

- [ ] Verify build works:
  ```bash
  npm run build
  # Should output:
  # - dist/index.js
  # - dist/index.d.ts
  # - dist/ui.css
  # - dist/ui-dark.css
  ```

- [ ] Verify tests run:
  ```bash
  npm run test:unit    # Should pass (even with no tests)
  npm run test:e2e     # Should pass (even with no tests)
  ```

- [ ] Create smoke test:
  ```typescript
  // tests/unit/smoke.spec.ts
  import { describe, it, expect } from 'vitest'
  
  describe('Build smoke test', () => {
    it('should have CSS variables defined', () => {
      // This will be replaced with real tests
      expect(true).toBe(true)
    })
  })
  ```

## 🎯 Acceptance Criteria

Phase 0 is complete when:

✅ Build runs without errors  
✅ Outputs `dist/ui.css` and `dist/ui-dark.css`  
✅ Both CSS files contain `@layer` declarations  
✅ Both CSS files define all `--pounce-*` variables  
✅ Dark theme has inverted colors  
✅ Unit tests run (even if empty)  
✅ E2E tests run (even if empty)  
✅ TypeScript compilation succeeds  
✅ All config files are in place  

## 📝 Notes

- **SCSS Syntax**: Use indented syntax (no braces/semicolons) as requested
- **CSS Layers**: Critical for specificity management - don't skip this
- **Dual Output**: Light and dark themes are separate files, user chooses which to import
- **Component Styles**: Extracted at build time, not runtime
- **SSR Safety**: No client-only code in build process

## 🚀 Next Steps

After Phase 0 is complete:
1. Proceed to Group A tasks (CSS variables + adapter architecture)
2. Multiple agents can work on Group B (component migration) in parallel
3. See [WALKTHROUGH.md](./WALKTHROUGH.md) for full task breakdown

# Pounce UI: Framework-Agnostic Architecture Analysis

## Executive Summary

This document analyzes the architectural strategy for decoupling Pounce UI components from PicoCSS, transforming `@pounce/pico` into a framework-agnostic `@pounce/ui` package. The goal is to maintain all existing functionality while enabling integration with any CSS framework (PicoCSS, Tailwind, vanilla CSS, etc.).

## Current State Assessment

### Package Structure
- **Location**: `@pounce/pico` at `/home/fmdm/dev/ownk/pounce/packages/pico`
- **Components**: ~24 sophisticated components including:
  - `DockView` (window management with dockview-core integration)
  - `RadioButton`, `CheckButton` (form controls)
  - `MultiSelect`, `ComboBox` (complex inputs)
  - `Dialog`, `Toast`, `Alert` (overlays)
  - `Menu`, `Toolbar`, `ButtonGroup` (navigation)
  - `InfiniteScroll`, `ErrorBoundary` (utilities)
- **Testing**: Comprehensive coverage (unit + e2e with Playwright)
- **Documentation**: Well-documented in LLM.md

### CSS Coupling Analysis

**Direct Dependency:**
```typescript
// src/index.ts
import '@picocss/pico/css/pico.min.css'
```

**CSS Variable Dependencies:**
Components currently rely on PicoCSS CSS variables:
- **Colors**: `--pico-primary`, `--pico-secondary`, `--pico-contrast`
- **Spacing**: `--pico-spacing`, `--pico-border-radius`
- **Forms**: `--pico-form-element-height`
- **Backgrounds**: `--pico-card-background-color`, `--pico-background-color`
- **Borders**: `--pico-muted-border-color`
- **Text**: `--pico-color`, `--pico-muted-color`, `--pico-contrast`

**Custom Styling Layer:**
- Components use `css` and `sass` tagged templates from `@pounce/kit/entry-dom`
- Current prefix: `pp-*` classes (e.g., `pp-button`, `pp-radiobutton`, `pp-dv-item`)
- Current variables: `--pp-*` (e.g., `--pp-success`, `--pp-warning`, `--pp-danger`)

**Migration Goals:**
1. Replace all `--pico-*` references with `--pounce-*` variables (sensible defaults, no fallback chain)
2. Rename `pp-*` classes to `pounce-*` for consistency with package name
3. Consolidate `--pp-*` variables into the `--pounce-*` namespace

### Architecture Strengths
- ✅ **Framework-agnostic logic**: Uses `mutts` for reactivity, not tied to React/Vue/etc.
- ✅ **Clean separation**: Behavior logic already separated from styling
- ✅ **Composable**: Uses `compose()` pattern from `@pounce/core`
- ✅ **Accessible**: Good ARIA support throughout
- ✅ **SSR-ready**: Follows dual entry-point policy

## Strategic Recommendations

### Layered Architecture

```
@pounce/ui (core - vanilla CSS by default)
├── Components with behavior + complete CSS
├── CSS variables contract (--pounce-*) with sensible defaults
├── Works standalone (no adapter required)
└── No framework dependencies

@pounce/ui-pico (PicoCSS adapter - optional)
├── Maps --pounce-* → --pico-* variables
├── Imports @picocss/pico
└── Provides PicoCSS theme integration

@pounce/ui-tailwind (Tailwind adapter - optional)
├── Tailwind utility class mappings
├── Tailwind plugin for component styles
└── Configuration presets
```

**Key Insight**: Vanilla CSS is simply `@pounce/ui` without any adapter. The core package provides complete, functional styling through `--pounce-*` variables with sensible defaults.

## Implementation Strategy

### Phase 1: CSS Variable Contract & Layer Strategy

Define minimal design tokens that components depend on, using CSS `@layer` to manage specificity:

```css
/* Core package (@pounce/ui) uses @layer for easy overriding */
@layer pounce.base {
  :root {
    /* Core colors */
    --pounce-primary: #3b82f6;
    --pounce-secondary: #64748b;
    --pounce-contrast: #0f172a;
    
    /* Semantic colors */
    --pounce-success: #15803d;
    --pounce-warning: #f59e0b;
    --pounce-danger: #b91c1c;
    
    /* Layout */
    --pounce-spacing: 1rem;
    --pounce-border-radius: 0.5rem;
    --pounce-form-height: 2.5rem;
    
    /* Backgrounds & borders */
    --pounce-bg: #fff;
    --pounce-card-bg: #fff;
    --pounce-fg: #000;
    --pounce-border: rgba(0, 0, 0, 0.2);
    --pounce-muted: #888;
    --pounce-muted-border: rgba(0, 0, 0, 0.2);
  }
}

@layer pounce.components {
  /* All component styles go here */
  .pounce-button {
    border-color: var(--pounce-border);
    /* ... */
  }
}
```

**Layer Strategy Benefits:**
- Adapters and user styles can override without `!important`
- Predictable specificity regardless of selector complexity
- Framework adapters can inject into `pounce.base` layer to override variables
- User styles naturally win over component styles

### Phase 2: Component Refactoring

Replace `--pico-*` variables with `--pounce-*` variables directly:

```css
/* Before */
border-color: var(--pico-muted-border-color, rgba(0, 0, 0, 0.2));

/* After */
border-color: var(--pounce-border);
```

The `--pounce-*` variables are defined in the core package with sensible defaults. No fallback chain needed - adapters simply override these variables to integrate with their framework's theme system.

### Phase 3: Adapter Packages

**@pounce/ui-pico** (PicoCSS Integration):
```css
:root {
  --pounce-primary: var(--pico-primary);
  --pounce-spacing: var(--pico-spacing);
  --pounce-border-radius: var(--pico-border-radius);
  /* ... map all variables */
}
```

**@pounce/ui-tailwind** (Tailwind Integration):
```javascript
// tailwind.config.js plugin
module.exports = {
  plugins: [
    require('@pounce/ui-tailwind')({
      // Maps Tailwind theme to --pounce-* variables
    })
  ]
}
```

**Vanilla CSS** (No adapter needed):
```typescript
// Just import @pounce/ui - it works standalone
import { Button, DockView } from '@pounce/ui'

// Optionally customize CSS variables
document.documentElement.style.setProperty('--pounce-primary', '#ff6b6b')
```

### Phase 4: Migration Path

1. **Dual Publishing**: Publish `@pounce/ui` alongside deprecated `@pounce/pico`
2. **Deprecation Notice**: Add warning in `@pounce/pico` docs
3. **Migration Guide**: Provide step-by-step upgrade instructions
4. **Archive**: After 1-2 releases, archive `@pounce/pico`

## Maximum Configurability Strategy

### Design Philosophy

Provide **sensible defaults with full override capability** - every structural and styling decision should be configurable by framework adapters.

### Configuration Points

#### 1. CSS Class Injection

Every structural element accepts class overrides:

```typescript
type ComponentClasses = {
  root?: string
  icon?: string
  label?: string
  // ... all structural elements
}

export const Button = (props: ButtonProps & { classes?: ComponentClasses }) => {
  return (
    <button class={[baseClasses.root, props.classes?.root]}>
      <span class={[baseClasses.icon, props.classes?.icon]}>{icon}</span>
      <span class={[baseClasses.label, props.classes?.label]}>{label}</span>
    </button>
  )
}
```

#### 2. Structural Composition Callbacks

For components where element order/hierarchy matters:

```typescript
type ComboBoxRenderer = (parts: {
  input: JSX.Element
  button: JSX.Element
  dropdown: JSX.Element
}) => JSX.Element

// Default implementation
const defaultRenderer: ComboBoxRenderer = ({ input, button, dropdown }) => (
  <div class="pp-combobox">
    {input}
    {button}
    {dropdown}
  </div>
)

// Tailwind might want different structure
const tailwindRenderer: ComboBoxRenderer = ({ input, button, dropdown }) => (
  <div class="relative">
    <div class="flex items-center">
      {input}
      {button}
    </div>
    {dropdown}
  </div>
)
```

#### 3. Icon Placement Configuration

```typescript
type IconPlacement = 
  | 'inside-start'   // Icon inside button, before text
  | 'inside-end'     // Icon inside button, after text
  | 'outside-start'  // Icon outside button (e.g., <summary>)
  | 'outside-end'    // Icon after button

// Framework adapter provides defaults
const picoAdapter = {
  Button: { iconPlacement: 'inside-start' },
  Summary: { iconPlacement: 'outside-end' }
}
```

#### 4. Event Target Configuration

Some frameworks need events on different elements:

```typescript
type EventTarget = 'root' | 'input' | 'button' | 'wrapper'

const config = {
  ComboBox: {
    clickTarget: 'button',  // Where onClick is attached
    focusTarget: 'input'    // Where onFocus is attached
  }
}
```

#### 5. Transition/Animation Strategy

**Reactive Approach** (preferred - aligns with `mutts` reactivity):

```typescript
type TransitionConfig = {
  enterClass?: string
  exitClass?: string
  activeClass?: string
  duration?: number
}

// Component uses reactive state for transitions
const Dialog = (props) => {
  const state = reactive({
    isOpen: false,
    isTransitioning: false
  })
  
  const transitionConfig = getAdapter('Dialog').transitions || {
    enterClass: 'pounce-enter',
    exitClass: 'pounce-exit',
    activeClass: 'pounce-active'
  }
  
  return (
    <div 
      class={[
        'pounce-dialog',
        state.isOpen && transitionConfig.activeClass,
        state.isTransitioning && (state.isOpen ? transitionConfig.enterClass : transitionConfig.exitClass)
      ]}
    >
      {props.children}
    </div>
  )
}

// Tailwind adapter provides CSS classes
const tailwindAdapter = {
  Dialog: {
    transitions: {
      enterClass: 'transition-opacity duration-200 opacity-0',
      activeClass: 'opacity-100',
      exitClass: 'transition-opacity duration-200 opacity-0'
    }
  }
}
```

**Benefits:**
- Predictable: Transitions are part of reactive state, not imperative side effects
- SSR-safe: Classes are computed during render, no client-only DOM manipulation
- Debuggable: Transition state visible in component state, not hidden in closures

### Adapter Architecture

```typescript
// @pounce/ui/core
export type ComponentAdapter<Props = any> = {
  classes?: Partial<Record<string, string>>
  renderStructure?: (parts: ComponentParts) => JSX.Element
  events?: Partial<Record<string, EventTarget>>
  transitions?: TransitionConfig
  iconPlacement?: IconPlacement
  iconResolver?: (name: string) => JSX.Element
}

export type FrameworkAdapter = {
  [ComponentName: string]: ComponentAdapter
}

// Simple global adapter (one per application)
let currentAdapter: FrameworkAdapter = {}

export function setAdapter(adapter: FrameworkAdapter) {
  currentAdapter = { ...currentAdapter, ...adapter }
}

export function getAdapter<T extends keyof FrameworkAdapter>(
  component: T
): ComponentAdapter {
  return currentAdapter[component] || {}
}
```

**How It Works:**
1. **Import adapter once** at app startup (e.g., `import '@pounce/ui-pico'`)
2. **Adapter sets global config** via `setAdapter(picoAdapter)`
3. **Components read config** via `getAdapter('Button')`
4. **Bundler includes adapter** in your app bundle

**No runtime registry complexity** - just a module-level variable that gets set once and read many times.

### Usage Examples

```typescript
// Option 1: Vanilla CSS (no adapter needed)
import { Button, DockView } from '@pounce/ui'

<Button variant="primary" icon="check">Save</Button>

// Option 2: With PicoCSS theme integration
import '@pounce/ui-pico'
import { Button, DockView } from '@pounce/ui'

<Button variant="primary" icon="check">Save</Button>

// Option 3: With Tailwind
import '@pounce/ui-tailwind'
import { Button, DockView } from '@pounce/ui'

<Button variant="primary" icon="check">Save</Button>

// Option 4: Custom adapter
import { setAdapter } from '@pounce/ui'

setAdapter({
  Button: {
    classes: {
      root: 'my-custom-button',
      icon: 'my-icon-wrapper'
    },
    iconPlacement: 'outside-start'
  }
})
```

## Potential Limitations & Solutions

### 1. DOM Structure Constraints

**Challenge**: Some frameworks expect specific DOM hierarchies (e.g., Tailwind's `group-hover`, parent-child selectors).

**Solution**: Provide `renderStructure` callbacks at the adapter level:

```typescript
export const tailwindAdapter = {
  Button: {
    renderStructure: (props, children) => (
      <button class="group relative">
        <span class="group-hover:scale-110 transition-transform">
          {children}
        </span>
      </button>
    )
  }
}
```

### 2. SSR Adapter Safety & Hydration

**Challenge**: If `renderStructure` callbacks produce different DOM on server vs. client (e.g., adapter loaded only client-side), hydration will fail.

**Solution**: Adapters must be configured **before** SSR rendering:

```typescript
// server/entry.ts (Node.js entry point)
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/ui-pico'

// CRITICAL: Set adapter before any rendering
setAdapter(picoAdapter)

// Now safe to render
import { renderToString } from '@pounce/core/ssr'
const html = renderToString(<App />)
```

**Enforcement Strategy:**
- Adapters export a synchronous configuration object (no async imports)
- `setAdapter()` throws if called after first component render
- SSR documentation emphasizes adapter setup in entry point
- Dual entry-point architecture ensures adapter is available in both environments

### 3. CSS Variable Scope

**Challenge**: Some frameworks use different scoping strategies (specificity issues).

**Solution**: Use CSS `@layer` (see Phase 1) to ensure adapters can override without specificity wars:

```css
/* @pounce/ui-tailwind includes */
@layer pounce.base {
  :root {
    --pounce-primary: theme('colors.blue.500');
  }
}
```

### 3. Icon Strategy

**Challenge**: Different icon libraries (Lucide, FontAwesome, pure-glyf, SVG strings) have different APIs.

**Solution**: Accept both string names and JSX elements, let adapters provide icon resolution:

```typescript
type IconResolver = (name: string) => JSX.Element

// Default: uses pure-glyf (current implementation)
const defaultIconResolver: IconResolver = (name) => <Icon icon={name} />

// Adapter can override
const lucideAdapter = {
  iconResolver: (name) => {
    const LucideIcon = lucideIcons[name]
    return <LucideIcon size={18} />
  }
}

// Component accepts both
<Button icon="check" />           // String: uses adapter's resolver
<Button icon={<CustomSvg />} />   // JSX: used directly
```

### 4. Accessibility Attributes

**Challenge**: ARIA attributes might need different placement depending on structure.

**Solution**: Keep accessibility logic in core, but allow attribute spreading:

```typescript
const ariaProps = {
  'aria-expanded': isOpen,
  'aria-haspopup': 'listbox',
  'role': 'combobox'
}

// Core ensures these exist, adapter decides where they go
{renderStructure({ ariaProps, inputProps, buttonProps })}
```

### 4. Dark Mode Handling

**Challenge**: Different frameworks handle theme switching differently (CSS classes, data attributes, media queries).

**Solution**: Provide theme detection utilities and let adapters implement switching:

```typescript
// @pounce/ui/core
export function useTheme() {
  // Returns reactive theme state
}

// @pounce/ui-pico
// Uses [data-theme="dark"] attribute

// @pounce/ui-tailwind
// Uses .dark class on root
```

### 5. Form Validation Feedback

**Challenge**: Visual feedback patterns vary widely across frameworks.

**Solution**: Provide validation state props, let adapters style:

```typescript
type ValidationState = 'valid' | 'invalid' | 'pending' | undefined

<Input 
  validationState={state}
  validationMessage="Email is required"
/>

// Adapter provides classes based on state
```

### 6. Responsive Behavior

**Challenge**: Mobile-first vs. desktop-first breakpoints, different breakpoint values.

**Solution**: Use CSS custom properties for breakpoints, let adapters override:

```css
:root {
  --pounce-breakpoint-sm: 640px;
  --pounce-breakpoint-md: 768px;
  --pounce-breakpoint-lg: 1024px;
}

/* Tailwind adapter overrides to match Tailwind's breakpoints */
```

### 7. Focus Management

**Challenge**: Focus ring styles and keyboard navigation patterns differ.

**Solution**: Provide focus utilities, let adapters style:

```typescript
// Core handles focus logic
useFocusRing()

// Adapters provide focus-visible styles
.pp-button:focus-visible {
  outline: 2px solid var(--pounce-primary);
  outline-offset: 2px;
}
```

## Advantages of This Approach

### ✅ Alignment with Project Philosophy
- Matches "short and elegant" principle (ASNEAP)
- Consistent with dual entry-point architecture
- Follows existing patterns (`core`, `kit`, `board`, `ui`)
- No TypeScript casts or `any` types needed

### ✅ Technical Benefits
- **No breaking changes to logic**: Component behavior unchanged
- **Progressive enhancement**: Start with PicoCSS adapter, add others later
- **Minimal overhead**: CSS variables are lightweight, no runtime cost
- **SSR-compatible**: No runtime CSS-in-JS, works with server rendering
- **Tree-shakeable**: Import only components you use

### ✅ Developer Experience
- **Familiar API**: Existing `@pounce/pico` users see no changes
- **Easy migration**: Simple package rename + optional adapter import
- **Framework freedom**: Choose any CSS framework or none
- **Customizable**: Override any aspect without forking

### ✅ Maintainability
- **Single source of truth**: Component logic lives in one place
- **Adapter isolation**: Framework-specific code is separate
- **Test once**: Core tests work for all adapters
- **Documentation clarity**: Separate docs for core vs. adapters

## Testing Strategy

### Core Component Tests
- Unit tests for component logic (existing tests remain)
- Accessibility tests (existing Playwright tests remain)
- Behavior tests independent of styling

### Adapter Tests
- Visual regression tests per adapter
- Framework-specific integration tests
- CSS variable mapping verification

### Migration Tests
- Ensure `@pounce/ui-pico` adapter maintains `@pounce/pico` behavior
- Test vanilla CSS (no adapter) works standalone

## Documentation Requirements

### Core Documentation
- Component API reference
- CSS variable contract
- Accessibility guidelines
- SSR usage patterns

### Adapter Documentation
- Installation & setup per framework
- Configuration options
- Customization examples
- Migration guides

### Examples
- Starter templates for each adapter
- Common patterns (forms, layouts, navigation)
- Advanced customization recipes

## Migration Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Create `@pounce/ui` package structure
- [ ] Define CSS variable contract
- [ ] Set up adapter infrastructure
- [ ] Create `@pounce/ui-pico` adapter

### Phase 2: Component Migration (Week 3-4)
- [ ] Migrate core components to use `--pounce-*` variables
- [ ] Add adapter configuration points
- [ ] Update component tests
- [ ] Verify PicoCSS adapter maintains existing behavior

### Phase 3: Additional Adapters (Week 5-6)
- [ ] Create `@pounce/ui-tailwind` adapter (optional)
- [ ] Write adapter-specific tests
- [ ] Create vanilla CSS example projects (no adapter needed)
- [ ] Create PicoCSS and Tailwind example projects

### Phase 4: Documentation & Release (Week 7-8)
- [ ] Write comprehensive documentation
- [ ] Create migration guide
- [ ] Publish `@pounce/ui` v1.0.0
- [ ] Deprecate `@pounce/pico`
- [ ] Announce and gather feedback

## Architectural Clarifications

### Dependency on @pounce/kit

**Question**: Will `@pounce/ui` remain dependent on `@pounce/kit/entry-dom` for CSS/SASS tagged templates?

**Answer**: **Yes, but only as a peer dependency**. The `css` and `sass` tagged templates from `@pounce/kit` provide:
- Build-time CSS extraction (no runtime overhead)
- Scoped styles that work with SSR
- Integration with Vite's CSS pipeline

This aligns with the dual entry-point architecture and keeps `@pounce/ui` focused on components rather than build tooling.

### Naming Convention Migration

**Current State:**
- Classes: `pp-*` (e.g., `pp-button`, `pp-radiobutton`)
- Variables: `--pp-*` (e.g., `--pp-success`) and `--pico-*` (framework dependency)

**Target State:**
- Classes: `pounce-*` (e.g., `pounce-button`, `pounce-radiobutton`)
- Variables: `--pounce-*` only (e.g., `--pounce-success`, `--pounce-primary`)

**Migration Strategy:**
- Phase 2 includes renaming all `pp-*` → `pounce-*` for consistency
- Consolidate `--pp-*` variables into `--pounce-*` namespace
- No backward compatibility aliases (clean break from `@pounce/pico`)

### Base CSS Requirements

**Question**: If the base CSS isn't imported, will components look broken?

**Answer**: **No**. The CSS is automatically included when importing from `@pounce/ui`:

```typescript
// This is all you need - CSS is bundled with components
import { Button } from '@pounce/ui'
```

The `css` tagged templates from `@pounce/kit` ensure styles are:
1. Co-located with components
2. Automatically extracted during build
3. Included in the component's module graph
4. Properly scoped with `@layer pounce.components`

No separate CSS import required (unlike traditional CSS frameworks).

## Conclusion

The transformation from `@pounce/pico` to `@pounce/ui` is a natural evolution that:

1. **Preserves all existing functionality** while removing framework lock-in
2. **Aligns with project architecture** (dual entry-points, clean separation, ASNEAP)
3. **Enables future growth** (new adapters, new components)
4. **Maintains quality standards** (tests, accessibility, SSR)
5. **Improves developer experience** (framework choice, customization)
6. **Solves real problems** (CSS specificity via `@layer`, SSR safety, adapter consistency)

The adapter pattern with maximum configurability ensures that any CSS framework can integrate seamlessly, while the CSS variable contract provides a stable foundation that won't require frequent breaking changes.

By providing **everything-by-default and everything-configurable**, we create a UI library that is both immediately useful (with sensible defaults) and infinitely flexible (with comprehensive configuration options).

### Key Architectural Decisions

✅ **CSS `@layer`**: Prevents specificity wars, allows easy overriding (automated via Vite plugin)  
✅ **Mono-adapter focus**: Simple global registry, ASNEAP compliant  
✅ **Build-time validation**: Vite plugin ensures design token contract integrity  
✅ **Reactive transitions**: Predictable, SSR-safe, debuggable  
✅ **Synchronous adapters**: No hydration mismatches  
✅ **Icon flexibility**: Supports any icon library via resolver pattern  
✅ **Self-contained**: CSS bundled with components, no separate imports needed

## Build-Time Tooling (Via @pounce/kit)

To enforce this architecture without runtime overhead, the `css` utility in `@pounce/kit` is paired with a Vite plugin that handles:

1.  **Automatic @layer Wrapping**: Wraps all `css` template literals in `@layer pounce.components`.
2.  **Contract Validation**: Scans all `css` calls and fails the build if `--pico-*` or hardcoded colors are used instead of `--pounce-*` tokens.
3.  **Static Manifest**: Generates a JSON manifest of all required design tokens to aid in adapter implementation.

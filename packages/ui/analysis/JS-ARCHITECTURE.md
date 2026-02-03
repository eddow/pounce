# @pounce/ui JavaScript/TypeScript Architecture

This document specifies the JavaScript/TypeScript architecture for `@pounce/ui`, including component patterns, state management, adapter integration, and shared utilities.

## 🎯 Core Principles

1. **Reactive by Default**: All components use `mutts` reactive primitives
2. **SSR-Safe**: No client-only code in component initialization
3. **Type-Safe**: Full TypeScript coverage with strict types
4. **Composable**: Components use `compose()` pattern for state
5. **Adapter-Aware**: Components read adapter configuration at runtime

## 📦 Package Structure

```
@pounce/ui/
├── src/
│   ├── adapter/              # Adapter registry and types
│   │   ├── types.ts
│   │   ├── registry.ts
│   │   └── index.ts
│   ├── components/           # UI components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── directives/           # Reactive directives
│   │   ├── pointer.ts
│   │   ├── resize.ts
│   │   └── ...
│   ├── styles/               # Style utilities
│   │   ├── index.ts          # layer() exports
│   │   └── layers.scss       # CSS layer declarations
│   ├── shared/               # Shared state and utilities
│   │   ├── theme.ts          # ui.theme reactive state
│   │   └── icons.ts          # Icon resolver
│   └── index.ts              # Main export
```

## 🔧 Adapter Architecture

### Adapter Types

```typescript
// @pounce/ui/src/adapter/types.ts

/**
 * Configuration for a single component
 */
export type ComponentAdapter<Props = any> = {
  /** CSS class name overrides */
  classes?: Partial<Record<string, string>>
  
  /** Custom render structure (for complex DOM changes) */
  renderStructure?: (parts: ComponentParts<Props>) => JSX.Element
  
  /** Event target overrides (for delegation patterns) */
  events?: Partial<Record<string, EventTarget>>
  
  /** Transition class configuration */
  transitions?: TransitionConfig
  
  /** Icon placement strategy */
  iconPlacement?: IconPlacement
}

/**
 * Transition configuration for enter/exit animations
 */
export type TransitionConfig = {
  enterClass?: string
  exitClass?: string
  activeClass?: string
  duration?: number
}

/**
 * Icon placement options
 */
export type IconPlacement = 'start' | 'end' | 'both' | 'none'

/**
 * Component parts for custom rendering
 */
export type ComponentParts<Props = any> = {
  props: Props
  state: any
  children: JSX.Element | JSX.Element[]
  ariaProps: Record<string, any>
  [key: string]: any
}

/**
 * Framework adapter registry
 */
export type FrameworkAdapter = {
  [ComponentName: string]: ComponentAdapter
}

/**
 * Icon resolver function
 */
export type IconResolver = (name: string, size?: string | number) => JSX.Element
```

### Adapter Registry

```typescript
// @pounce/ui/src/adapter/registry.ts

let currentAdapter: FrameworkAdapter = {}
let isRendering = false

/**
 * Set the framework adapter configuration
 * Must be called before any component renders (SSR safety)
 * 
 * @throws Error if called after rendering has started
 */
export function setAdapter(adapter: FrameworkAdapter): void {
  if (isRendering) {
    throw new Error(
      '[pounce/ui] setAdapter() must be called before component rendering. ' +
      'Import and configure adapter in your app entry point.'
    )
  }
  currentAdapter = { ...currentAdapter, ...adapter }
}

/**
 * Get adapter configuration for a component
 * Marks rendering as started (for SSR safety check)
 */
export function getAdapter<T extends keyof FrameworkAdapter>(
  component: T
): ComponentAdapter {
  isRendering = true
  return currentAdapter[component] || {}
}

/**
 * Reset adapter state (for testing only)
 * @internal
 */
export function __resetAdapter(): void {
  currentAdapter = {}
  isRendering = false
}
```

## 🎨 Style Integration

### Layer Function (from @pounce/kit)

```typescript
// @pounce/kit/src/dom/css.ts

const registeredLayers = new Set<string>()

/**
 * Create a CSS template tag that wraps output in a CSS @layer
 * Automatically registers the layer on first use
 * 
 * Note: This function can be "flavored" with additional functionality
 * (cf. mutts pattern for extensible utilities)
 * 
 * @param layer - The CSS layer name (e.g., 'components', 'utilities')
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
export function layer(layerName: string) {
  return (strings: TemplateStringsArray, ...values: any[]): void => {
    // Register layer on first use
    if (!registeredLayers.has(layerName)) {
      registeredLayers.add(layerName)
      __injectCSS(`@layer ${layerName};`)
    }
    
    // Inject layered CSS
    const cssText = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
    const layeredCSS = `@layer ${layerName} {\n${cssText}\n}`
    __injectCSS(layeredCSS)
  }
}
```

### UI Style Exports

```typescript
// @pounce/ui/src/styles/index.ts
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

## 🧩 Component Pattern

### Basic Component Structure

```typescript
// @pounce/ui/src/components/button.tsx
import { compose } from 'mutts'
import { componentStyle } from '../styles'
import { getAdapter } from '../adapter'

// Inject component styles (runs once per module)
componentStyle`
  .pounce-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--pounce-primary);
    color: white;
    border: none;
    border-radius: var(--pounce-border-radius);
    cursor: pointer;
    
    &:hover {
      filter: brightness(0.9);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .pounce-button-icon {
    display: inline-flex;
    align-items: center;
  }
`

export type ButtonProps = {
  variant?: string
  icon?: string | JSX.Element
  iconPosition?: 'start' | 'end'
  disabled?: boolean
  onClick?: (e: MouseEvent) => void
  ariaLabel?: string
  tag?: 'button' | 'a' | 'div' | 'span'
  el?: JSX.HTMLAttributes<any>
  children?: JSX.Children
}

export const Button = (props: ButtonProps) => {
  // Get adapter configuration
  const adapter = getAdapter('Button')
  
  // Compose reactive state with defaults
  const state = compose(
    {
      variant: 'primary' as const,
      iconPosition: 'start' as const,
      disabled: false,
      onClick: () => {},
      ariaLabel: undefined as string | undefined,
      tag: 'button' as const,
    },
    props,
    (state) => ({
      // Computed: icon element
      get iconElement() {
        if (!state.icon) return null
        
        // String icon: use adapter's icon resolver or default
        if (typeof state.icon === 'string') {
          const resolver = adapter.iconResolver || defaultIconResolver
          return <span class="pounce-button-icon" aria-hidden>{resolver(state.icon)}</span>
        }
        
        // JSX icon: use directly
        return <span class="pounce-button-icon" aria-hidden>{state.icon}</span>
      },
      
      // Computed: has text label
      get hasLabel() {
        return !!state.children && (!Array.isArray(state.children) || state.children.some(e => !!e))
      },
      
      // Computed: icon-only button
      get isIconOnly() {
        return !!state.icon && !this.hasLabel
      },
      
      // Computed: CSS classes (with adapter overrides and vanilla fallbacks)
      get classes() {
        const base = adapter.classes?.base || 'pounce-button'
        const variant = getVariantClass(state.variant, adapter)
        const iconOnly = state.isIconOnly ? (adapter.classes?.iconOnly || 'pounce-button-icon-only') : undefined
        
        return [base, variant, iconOnly, state.el?.class].filter(Boolean)
      }
    })
  )
  
  // If adapter provides custom structure, use it
  if (adapter.renderStructure) {
    return adapter.renderStructure({
      props,
      state,
      children: state.children,
      ariaProps: {
        'aria-label': state.isIconOnly ? (state.ariaLabel || 'Action') : state.ariaLabel,
        'aria-disabled': state.disabled || undefined
      }
    })
  }
  
  // Default structure
  return (
    <dynamic
      tag={state.tag}
      {...state.el}
      onClick={state.onClick}
      disabled={state.disabled}
      aria-label={state.isIconOnly ? (state.ariaLabel ?? state.el?.['aria-label'] ?? 'Action') : (state.ariaLabel ?? state.el?.['aria-label'])}
      class={state.classes}
    >
      <span if={state.iconPosition === 'start'} class="pounce-button-icon-wrapper">
        {state.iconElement}
      </span>
      <fragment>
        <span if={state.hasLabel} class="pounce-button-label">
          {state.children}
        </span>
        <fragment else>{state.children}</fragment>
      </fragment>
      <span if={state.iconPosition === 'end'} class="pounce-button-icon-wrapper">
        {state.iconElement}
      </span>
    </dynamic>
  )
}

/**
 * Framework-agnostic Button component with dynamic variant support.
 * Usage: <Button.primary>, <Button.danger>, or <Button variant="custom">
 */
export const Button = asVariant(ButtonBase)
```

### Component with Transitions

```typescript
// @pounce/ui/src/components/dialog.tsx
import { compose, reactive } from 'mutts'
import { componentStyle } from '../styles'
import { getAdapter } from '../adapter'

componentStyle`
  .pounce-dialog {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 200ms;
    
    &.pounce-dialog-active {
      opacity: 1;
    }
  }
  
  .pounce-dialog-content {
    background: var(--pounce-bg);
    border-radius: var(--pounce-border-radius);
    padding: var(--pounce-spacing);
    max-width: 500px;
    transform: scale(0.95);
    transition: transform 200ms;
  }
  
  .pounce-dialog-active .pounce-dialog-content {
    transform: scale(1);
  }
`

export type DialogProps = {
  open?: boolean
  onClose?: () => void
  el?: JSX.GlobalHTMLAttributes
  children?: JSX.Element | JSX.Element[]
}

export const Dialog = (props: DialogProps) => {
  const adapter = getAdapter('Dialog')
  
  const state = compose(
    {
      open: false,
      onClose: () => {},
    },
    props,
    (state) => ({
      // Reactive transition state
      isTransitioning: reactive(false),
      
      // Computed: transition classes
      get transitionClasses() {
        const config = adapter.transitions || {
          activeClass: 'pounce-dialog-active',
          enterClass: 'pounce-dialog-enter',
          exitClass: 'pounce-dialog-exit'
        }
        
        return [
          state.open && config.activeClass,
          state.isTransitioning && (state.open ? config.enterClass : config.exitClass)
        ].filter(Boolean)
      }
    })
  )
  
  // Handle transition state reactively
  $effect(() => {
    if (state.open) {
      state.isTransitioning = true
      setTimeout(() => state.isTransitioning = false, 200)
    }
  })
  
  if (!state.open) return null
  
  return (
    <div
      class={['pounce-dialog', ...state.transitionClasses, state.el?.class]}
      onClick={(e) => {
        if (e.target === e.currentTarget) state.onClose()
      }}
    >
      <div class="pounce-dialog-content">
        {state.children}
      </div>
    </div>
  )
}
```

## � Variant Pattern (asVariant)

To keep components **asneap** and framework-agnostic, we avoid hardcoding variant names. Instead, we use the `asVariant` proxy helper.

### Dynamic Auto-Flavoring
`asVariant` wraps a component in a `Proxy` that treats any property access as a **variant flavor**.

```typescript
// src/shared/variants.ts
export function asVariant<T>(component: T): T & Record<string, T> {
  return new Proxy(component, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && !(prop in target)) {
        return flavorOptions(receiver as any, { variant: prop })
      }
      return Reflect.get(target, prop, receiver)
    }
  })
}
```

### Usage
This allows a fluent, descriptive API that is zero-config:
- `<Button.primary>` -> `{ variant: 'primary' }`
- `<Button.danger>` -> `{ variant: 'danger' }`
- `<Button.anything>` -> `{ variant: 'anything' }`

### Validation Logic
The `getVariantClass` utility (used inside components) handles the mapping and validation:

1. **Adapter Registry**: Checks if the active adapter has a mapping for the variant.
2. **Standard Fallback**: Checks if the variant is in the `STANDARD_VARIANTS` list (primary, danger, etc.).
3. **Development Warning**: Logs an error if a variant is neither registered nor standard, to prevent "mystery classes".

---

## �🌓 Shared State: ui.theme

### Theme State Management

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
- **Generic**: Supports any number of themes (not just light/dark)
- **Simple**: No methods, just assign: `ui.theme = 'dark'`
- **Reactive**: mutts handles change propagation automatically
- **Flexible**: Apps can define their own theme names

**System Preference Detection**: Kit's responsibility via `client.prefersDark()`

### Usage in Components

```typescript
// Components can observe theme changes
import { ui } from '../shared/theme'
import { client } from '@pounce/kit/dom'

export const ThemeButton = () => {
  // Initialize from system preference
  if (typeof window !== 'undefined' && !ui.theme) {
    ui.theme = client.prefersDark() ? 'dark' : 'light'
  }
  
  return (
    <button onClick={() => {
      // Simple toggle (or any custom logic)
      ui.theme = ui.theme === 'light' ? 'dark' : 'light'
    }}>
      {ui.theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}

// Multi-theme example
export const ThemeSelector = () => {
  return (
    <select value={ui.theme} onChange={(e) => ui.theme = e.target.value}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="sepia">Sepia</option>
      <option value="high-contrast">High Contrast</option>
    </select>
  )
}
```

### Adapter Integration

```typescript
// @pounce/ui-pico/src/index.ts
import { setAdapter } from '@pounce/ui/adapter'
import { ui } from '@pounce/ui/shared/theme'
import '@picocss/pico/css/pico.min.css'

// Watch theme changes and update PicoCSS data attribute
$effect(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', ui.theme)
  }
})

// Configure adapter
setAdapter({
  Button: {
    classes: {
      base: 'pounce-button',
      primary: 'pounce-button-primary',
      // ... PicoCSS-specific classes
    }
  }
})
```

## 🔍 CSS Variable Utilities (from @pounce/kit)

### Why These Belong in Kit

CSS variable manipulation is **generic infrastructure** - any package might need to read/write CSS variables. It's not UI-specific.

```typescript
// @pounce/kit/src/dom/css-vars.ts

/**
 * Set a CSS custom property (variable) on an element
 * 
 * @param name - Variable name (with or without -- prefix)
 * @param value - Variable value
 * @param element - Target element (defaults to :root)
 * 
 * @example
 * ```ts
 * setCSSVar('primary', '#3b82f6')
 * setCSSVar('--primary', '#3b82f6')  // Same result
 * ```
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
 * Get a CSS custom property (variable) value from an element
 * 
 * @param name - Variable name (with or without -- prefix)
 * @param element - Target element (defaults to :root)
 * @returns The computed variable value
 * 
 * @example
 * ```ts
 * const primary = getCSSVar('primary')
 * const primary = getCSSVar('--primary')  // Same result
 * ```
 */
export function getCSSVar(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  const varName = name.startsWith('--') ? name : `--${name}`
  return getComputedStyle(element).getPropertyValue(varName).trim()
}

/**
 * Remove a CSS custom property (variable) from an element
 * 
 * @param name - Variable name (with or without -- prefix)
 * @param element - Target element (defaults to :root)
 */
export function removeCSSVar(
  name: string,
  element: HTMLElement = document.documentElement
): void {
  const varName = name.startsWith('--') ? name : `--${name}`
  element.style.removeProperty(varName)
}
```

### Usage in @pounce/ui

```typescript
// @pounce/ui can use these utilities for dynamic theming
import { setCSSVar, getCSSVar } from '@pounce/kit/dom'

// Example: Dynamic color adjustment
export function adjustPrimaryColor(hue: number) {
  setCSSVar('pounce-primary', `hsl(${hue}, 70%, 50%)`)
}

// Example: Read current theme color
export function getCurrentPrimary(): string {
  return getCSSVar('pounce-primary')
}
```

## 📱 Media Query Utilities (from @pounce/kit)

### Why These Belong in Kit

Media query utilities are **generic infrastructure** - responsive behavior is needed across the framework, not just in UI components.

```typescript
// @pounce/kit/src/dom/media.ts
import { reactive } from 'mutts'

/**
 * Create a reactive media query matcher
 * Returns a reactive object that updates when the query matches/unmatches
 * 
 * @param query - CSS media query string
 * @returns Reactive object with `matches` property
 * 
 * @example
 * ```ts
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * 
 * // In component
 * <div if={isMobile.matches}>Mobile view</div>
 * <div else>Desktop view</div>
 * ```
 */
export function useMediaQuery(query: string) {
  const state = reactive({ matches: false })
  
  if (typeof window === 'undefined') return state
  
  const mediaQuery = window.matchMedia(query)
  state.matches = mediaQuery.matches
  
  const handler = (e: MediaQueryListEvent) => {
    state.matches = e.matches
  }
  
  mediaQuery.addEventListener('change', handler)
  
  // Cleanup (if component is destroyed)
  // Note: In real implementation, this would use mutts cleanup pattern
  
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

### Usage in @pounce/ui

```typescript
// @pounce/ui components can use media queries for responsive behavior
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

## 🎨 Icon Resolution

### Default Icon Resolver

```typescript
// @pounce/ui/src/shared/icons.ts
import { Icon } from 'pure-glyf'

/**
 * Default icon resolver using pure-glyf
 */
export const defaultIconResolver = (name: string, size: string | number = 18): JSX.Element => {
  return <Icon icon={name} size={size} />
}
```

### Adapter Icon Resolver

```typescript
// @pounce/ui-lucide (hypothetical adapter)
import * as LucideIcons from 'lucide-react'
import { setAdapter } from '@pounce/ui/adapter'

const lucideIconResolver = (name: string, size: string | number = 18): JSX.Element => {
  const IconComponent = LucideIcons[name]
  if (!IconComponent) {
    console.warn(`[pounce/ui-lucide] Icon "${name}" not found`)
    return <span>?</span>
  }
  return <IconComponent size={size} />
}

setAdapter({
  Button: {
    iconResolver: lucideIconResolver
  },
  // ... other components
})
```

## 🧪 Testing Patterns

### Component Testing

```typescript
// @pounce/ui/tests/unit/button.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '../helpers/render'
import { Button } from '../../src/components/button'
import { __resetAdapter } from '../../src/adapter'

describe('Button', () => {
  beforeEach(() => {
    __resetAdapter()
  })
  
  it('renders with default props', () => {
    const { container } = render(<Button>Click me</Button>)
    const button = container.querySelector('.pounce-button')
    
    expect(button).toBeTruthy()
    expect(button?.textContent).toBe('Click me')
  })
  
  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    const button = container.querySelector('.pounce-button')
    
    expect(button?.classList.contains('pounce-button-danger')).toBe(true)
  })
  
  it('respects adapter class overrides', () => {
    setAdapter({
      Button: {
        classes: {
          base: 'custom-button',
          primary: 'custom-primary'
        }
      }
    })
    
    const { container } = render(<Button variant="primary">Click</Button>)
    const button = container.querySelector('.custom-button')
    
    expect(button).toBeTruthy()
    expect(button?.classList.contains('custom-primary')).toBe(true)
  })
})
```

## 📋 Future Enhancements

### CSS Source Analyzer (TODO)

Add a build-time analyzer that:
- Scans component source files for CSS usage
- Validates CSS variable references
- Checks for unused styles
- Generates CSS coverage report

```typescript
// Future: @pounce/ui/scripts/analyze-css.ts
/**
 * Analyze CSS usage in component source files
 * 
 * Features:
 * - Find all CSS variable references (--pounce-*)
 * - Detect unused CSS classes
 * - Validate layer usage
 * - Generate coverage report
 * 
 * Usage:
 *   npm run analyze:css
 */
```

This should be added to the walkthrough as a future task.

## 🎯 Summary

### Kit Responsibilities
- ✅ `layer()` function for CSS @layer support
- ✅ CSS variable utilities (`setCSSVar`, `getCSSVar`)
- ✅ Media query utilities (`useMediaQuery`)
- ✅ Generic infrastructure (SSR, routing, storage)

### UI Responsibilities
- ✅ Component implementations using `compose()` pattern
- ✅ Adapter registry and types
- ✅ Shared state (`ui.theme`)
- ✅ Style exports (`baseStyle`, `componentStyle`)
- ✅ Icon resolution strategy
- ✅ CSS variable contract (`--pounce-*`)

### Key Patterns
1. **Reactive State**: All components use `mutts` primitives
2. **Adapter Integration**: Components read `getAdapter()` for configuration
3. **Shared Theme**: `ui.theme` is the single source of truth
4. **SSR Safety**: No client-only code in initialization
5. **Type Safety**: Full TypeScript coverage

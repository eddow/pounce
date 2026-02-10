# Display Context Architecture

## Problem

Display concerns (theme, direction, locale) were initially placed in the adapter system, but this creates coupling:

1. **Adapters are about styling/structure** (how to render), not display state (what to show)
2. **Theme/direction are runtime state**, not configuration
3. **Need re-entrant contexts** (Arabic section in English UI)
4. **User controls are separate** (dark/light button, language select)

## Solution: Scope-Based Display Context

Similar to the overlay system, display concerns are provided via **scope-based context** that can be:
- Read from system defaults (OS theme, browser language)
- Overridden by user controls
- Nested for re-entrant contexts

## Architecture

### 1. System Defaults (in @pounce/kit)

Kit provides **readonly** system values:

```typescript
// @pounce/kit/dom
export const system = {
  /** OS theme preference (readonly) */
  theme: reactive<'light' | 'dark'>('light'),
  
  /** Browser language direction (readonly) */
  direction: reactive<'ltr' | 'rtl'>('ltr'),
  
  /** Browser locale (readonly) */
  locale: reactive<string>('en-US')
}

// Auto-detected on client
if (typeof window !== 'undefined') {
  // Detect theme from OS
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  system.theme.value = darkModeQuery.matches ? 'dark' : 'light'
  darkModeQuery.addEventListener('change', (e) => {
    system.theme.value = e.matches ? 'dark' : 'light'
  })
  
  // Detect direction from document or <html dir="...">
  system.direction.value = document.dir === 'rtl' ? 'rtl' : 'ltr'
  
  // Detect locale from browser
  system.locale.value = navigator.language
}
```

### 2. Display Context (in @pounce/ui)

Scope-based context for display concerns:

```typescript
// @pounce/ui/src/shared/display-context.tsx

export type DisplayContext = {
  /** Resolved theme (never 'auto' — always the concrete value) */
  theme: string
  /** Raw theme setting ('auto' | 'light' | 'dark' | custom) */
  themeSetting: string
  /** Resolved text direction */
  direction: 'ltr' | 'rtl'
  /** Resolved locale */
  locale: string
  /** Update theme setting for this provider */
  setTheme: (theme: string) => void
}

/** Default display context (uses system defaults) */
const defaultContext: DisplayContext = {
  theme: system.theme.value,
  direction: system.direction.value,
  locale: system.locale.value
}

/** Scope key for display context */
const DISPLAY_CONTEXT_KEY = Symbol('pounce:display-context')

/**
 * Get current display context from scope
 * Falls back to system defaults if no context provided
 */
export function useDisplayContext(): DisplayContext {
  const scope = getCurrentScope()
  return scope?.get(DISPLAY_CONTEXT_KEY) ?? defaultContext
}

/**
 * Display context provider component.
 * Sets data-theme, dir, lang on its OWN element — never on <html>.
 * Defaults to 'auto' (inherit from parent provider, or system defaults at root).
 * Can be nested for re-entrant contexts.
 */
export const DisplayProvider = (props: {
  theme?: string | 'auto'           // default: 'auto'
  direction?: 'ltr' | 'rtl' | 'auto' // default: 'auto'
  locale?: string | 'auto'          // default: 'auto'
  onThemeChange?: (theme: string) => void
  children: JSX.Children
}) => {
  const parentContext = useDisplayContext()  // null at root
  const themeSetting = reactive(props.theme ?? 'auto')

  // Resolve 'auto' → parent value, or system default at root
  const resolve = <T,>(setting: T | 'auto', parentValue: T, systemValue: T): T =>
    setting === 'auto'
      ? (parentContext ? parentValue : systemValue)
      : setting

  const context: DisplayContext = {
    get theme() {
      return resolve(themeSetting.value, parentContext?.theme ?? system.theme.value, system.theme.value)
    },
    get themeSetting() { return themeSetting.value },
    get direction() {
      const dir = props.direction ?? 'auto'
      return resolve(dir, parentContext?.direction ?? system.direction.value, system.direction.value)
    },
    get locale() {
      const loc = props.locale ?? 'auto'
      return resolve(loc, parentContext?.locale ?? system.locale.value, system.locale.value)
    },
    setTheme(t: string) {
      themeSetting.value = t
      props.onThemeChange?.(t)
    }
  }

  return (
    <div data-theme={context.theme} dir={context.direction} lang={context.locale}>
      <scope provide={{ [DISPLAY_CONTEXT_KEY]: context }}>
        {props.children}
      </scope>
    </div>
  )
}
```

### 3. Component Usage

Components access display context from scope:

```typescript
// @pounce/ui/src/components/button.tsx

export const Button = (props: ButtonProps) => {
  const display = useDisplayContext()
  
  const state = compose(
    { /* ... */ },
    props,
    (s: any) => ({
      get iconElement() {
        if (!s.icon) return null
        
        // Use display.direction for logical positioning
        const position = display.direction === 'rtl' 
          ? (s.iconPosition === 'before' ? 'end' : 'start')
          : (s.iconPosition === 'before' ? 'start' : 'end')
        
        return <Icon name={s.icon} position={position} />
      },
      
      get classes() {
        // Could use display.theme for theme-specific classes
        const themeClass = `pounce-theme-${display.theme}`
        return [base, variant, themeClass, s.el?.class].filter(Boolean)
      }
    })
  )
  
  return <button class={state.classes}>{/* ... */}</button>
}
```

## Usage Examples

### Example 1: ThemeToggle (auto/dark/light)

```typescript
import { DisplayProvider, ThemeToggle } from '@pounce/ui'
import { stored } from '@pounce/kit'

const App = () => {
  const prefs = stored({ theme: 'auto' })
  
  return (
    <DisplayProvider theme={prefs.theme} onThemeChange={(t) => prefs.theme = t}>
      <ThemeToggle />           {/* reads/writes via useDisplayContext() */}
      <Button>Themed Button</Button>
    </DisplayProvider>
  )
}
```

### Example 2: Language Selector

```typescript
const App = () => {
  const [lang, setLang] = signal<'en' | 'ar'>('en')
  
  return (
    <DisplayProvider 
      direction={lang.value === 'ar' ? 'rtl' : 'ltr'}
      locale={lang.value === 'ar' ? 'ar-SA' : 'en-US'}
    >
      <select onChange={(e) => setLang(e.target.value)}>
        <option value="en">English</option>
        <option value="ar">العربية</option>
      </select>
      
      <Button icon="arrow-forward">Next</Button>
    </DisplayProvider>
  )
}
```

### Example 3: Re-entrant Context (Arabic Section in English UI)

```typescript
const App = () => {
  return (
    <DisplayProvider theme="light" direction="ltr">
      <h1>English Interface</h1>
      <Button>English Button</Button>
      
      {/* Nested context for Arabic content */}
      <DisplayProvider direction="rtl">
        <section>
          <h2>محتوى عربي</h2>
          <Button>زر عربي</Button>
        </section>
      </DisplayProvider>
      
      <Button>Back to English</Button>
    </DisplayProvider>
  )
}
```

### Example 4: System Defaults (No Provider)

```typescript
// No DisplayProvider - uses system defaults
const App = () => {
  return (
    <div>
      {/* Automatically uses OS theme and browser language */}
      <Button>Button</Button>
    </div>
  )
}
```

## Benefits

### 1. Separation of Concerns
- **Adapters**: Styling/structure (icons, variants, components, transitions)
- **Display Context**: Presentation state (theme, direction, locale)

### 2. Scope-Based Access
- Components read from scope (like overlays)
- No global state pollution
- Testable (provide mock context in tests)

### 3. Re-entrant Contexts
- Nest `DisplayProvider` for localized overrides
- Arabic section in English UI
- Dark widget in light UI

### 4. System Defaults
- Kit provides readonly system values
- Components work without configuration
- Respects user OS preferences

### 5. User Control
- User controls (buttons, selects) update context
- Not bound to adapter configuration
- Runtime state, not build-time config

## Comparison: Adapter vs Display Context

### Before (Adapter-Based)
```typescript
// ❌ Couples display state with styling config
setAdapter({
  directionality: { direction: 'rtl' },  // Build-time config
  variants: { primary: 'pico-primary' }
})

// Can't easily change at runtime
// Can't nest contexts
// Mixes concerns
```

### After (Display Context)
```typescript
// ✅ Separates display state from styling
setAdapter({
  variants: { primary: 'pico-primary' }  // Styling only
})

// Runtime state via scope
<DisplayProvider direction="rtl">
  <Button>زر</Button>
</DisplayProvider>

// Can nest, can change at runtime
// Clear separation of concerns
```

## Implementation Status

### Required Changes

1. **@pounce/kit**:
   - [ ] Add `system.theme`, `system.direction`, `system.locale` reactive values
   - [ ] Auto-detect from OS/browser on client

2. **@pounce/ui**:
   - [ ] Create `src/shared/display-context.tsx`
   - [ ] Export `DisplayProvider` and `useDisplayContext()`
   - [ ] Remove `directionality` from `FrameworkAdapter` type
   - [ ] Update components to use `useDisplayContext()` where needed

3. **Documentation**:
   - [ ] Document display context pattern
   - [ ] Add examples for theme toggle, language selector
   - [ ] Explain re-entrant contexts

### Migration Path

No breaking changes - display context is additive:
1. Components work without `DisplayProvider` (use system defaults)
2. Users can opt-in to `DisplayProvider` for overrides
3. Existing adapter code unaffected

## Future Extensions

Display context could be extended with more concerns:

```typescript
// Future additions to DisplayContext:
fontSize?: 'small' | 'medium' | 'large'
contrast?: 'normal' | 'high'
reducedMotion?: boolean
density?: 'compact' | 'comfortable' | 'spacious'
```

These would all be scope-based, re-entrant, and separate from adapter configuration.

## ThemeToggle Component

Split-button UX:
- **Main button**: quick toggle dark ↔ light
- **Dropdown arrow**: submenu with dark / light / auto

4 visual states:
| Setting | Resolved | Icon | Label |
|---|---|---|---|
| `'dark'` | dark | moon | "Dark" |
| `'light'` | light | sun | "Light" |
| `'auto'` | dark | moon + auto badge | "Auto (Dark)" |
| `'auto'` | light | sun + auto badge | "Auto (Light)" |

All icons and labels customizable via props. Uses `useDisplayContext()` to read `themeSetting` and call `setTheme()`.

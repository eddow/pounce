# @pounce/ui

Framework-agnostic UI component library for Pounce applications.

## Status

🚧 **Under Development** — Migrated from `@pounce/pico`. All components functional, adapter system operational.

## Quick Start

```tsx
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'

// Optional: install a CSS framework adapter
setAdapter(picoAdapter)

// Use components
import { Button, CheckButton, Badge } from '@pounce/ui'

const App = () => (
  <div>
    <Button.primary onClick={() => alert('hi')}>Click me</Button.primary>
    <CheckButton icon="star" checked={true}>Favorite</CheckButton>
    <Badge.success>Online</Badge.success>
  </div>
)
```

## Architecture

- **CSS Variable Contract**: All styling uses `--pounce-*` variables with sensible defaults
- **Adapter Pattern**: `setAdapter()` configures variants, icons, component classes, and transitions
- **Variant Traits**: `<Button.danger>` dot-syntax via `asVariant()` proxy — traits carry classes + ARIA attributes
- **Centralized Icon**: Global `iconFactory` in adapter, consumed via `<Icon name="..." />`
- **SSR-Ready**: No client-only DOM access during render

See [analysis/](./analysis/README.md) for architectural deep-dives.

---

## Components

### Button

Interactive button with icon support and variant styling.

```tsx
import { Button } from '@pounce/ui'

<Button>Default</Button>
<Button.danger>Delete</Button.danger>
<Button icon="save">Save</Button>
<Button icon="settings" aria-label="Settings" />  {/* icon-only */}
<Button disabled>Disabled</Button>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'primary'` | Variant name (looked up in adapter) |
| `icon` | `string \| JSX.Element` | — | Icon name or element |
| `iconPosition` | `'start' \| 'end'` | `'start'` | Icon placement |
| `el` | `JSX.HTMLAttributes<'button'>` | — | Pass-through HTML attributes |
| `children` | `JSX.Children` | — | Button label |

**Adapter key**: `Button` (`IconAdaptation`)  
**CSS classes**: `.pounce-button`, `.pounce-button-icon-only`, `.pounce-button-label`

---

### CheckButton

Toggle button with `role="checkbox"`, icon support, and variant styling.

```tsx
import { CheckButton } from '@pounce/ui'

<CheckButton checked={true}>Active</CheckButton>
<CheckButton icon="star" onCheckedChange={(v) => console.log(v)}>Favorite</CheckButton>
<CheckButton.danger icon="pin" checked={pinned}>Pinned</CheckButton.danger>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'primary'` | Variant name |
| `icon` | `string \| JSX.Element` | — | Icon name or element |
| `iconPosition` | `'start' \| 'end'` | `'start'` | Icon placement |
| `checked` | `boolean` | `false` | Checked state |
| `onCheckedChange` | `(checked: boolean) => void` | — | Change callback |
| `aria-label` | `string` | — | Required for icon-only buttons |

**Adapter key**: `CheckButton` (`IconAdaptation`)  
**CSS classes**: `.pounce-checkbutton`, `.pounce-checkbutton-checked`, `.pounce-checkbutton-icon`, `.pounce-checkbutton-label`

---

### ButtonGroup

Groups buttons with shared border radius and keyboard navigation (Arrow keys cycle within group, Tab exits).

```tsx
import { ButtonGroup, Button } from '@pounce/ui'

<ButtonGroup>
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</ButtonGroup>

<ButtonGroup orientation="vertical">
  <Button>Top</Button>
  <Button>Bottom</Button>
</ButtonGroup>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `class` | `string` | — | Additional CSS class |
| `style` | `string` | — | Inline style |

**Adapter key**: `ButtonGroup` (`BaseAdaptation`)  
**CSS classes**: `.pounce-buttongroup`, `.pounce-buttongroup-horizontal`, `.pounce-buttongroup-vertical`  
**Keyboard**: Arrow keys navigate within group. Tab exits to next focusable. Toolbar segment cycling supported.

---

### Select

Native `<select>` with variant accent and adapter class support.

```tsx
import { Select } from '@pounce/ui'

<Select>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</Select>

<Select fullWidth variant="danger">
  <option>Critical</option>
</Select>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'primary'` | Variant name |
| `fullWidth` | `boolean` | `false` | Stretch to container width |

**Adapter key**: `Select` (`BaseAdaptation`)  
**CSS classes**: `.pounce-select`, `.pounce-select-full`

---

### Combobox

Text input with `<datalist>` suggestions.

```tsx
import { Combobox } from '@pounce/ui'

<Combobox options={['Apple', 'Banana', 'Cherry']} placeholder="Pick a fruit..." />
<Combobox options={[{ value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' }]} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'primary'` | Variant name |
| `options` | `(string \| { value, label? })[]` | `[]` | Suggestion list |

**Adapter key**: `Combobox` (`BaseAdaptation`)  
**CSS classes**: `.pounce-combobox`

---

### Checkbox

Labeled checkbox with description support.

```tsx
import { Checkbox } from '@pounce/ui'

<Checkbox label="Accept terms" />
<Checkbox label="Newsletter" description="We'll send weekly updates" checked={true} />
<Checkbox variant="success" label="Verified" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string \| JSX.Element` | — | Label text |
| `description` | `string \| JSX.Element` | — | Helper text below label |
| `variant` | `string` | `'primary'` | Accent color variant |
| `checked` | `boolean` | — | Checked state |

**Adapter key**: `Checkbox` (`BaseAdaptation`)  
**CSS classes**: `.pounce-control`, `.pounce-checkbox`, `.pounce-control-input`, `.pounce-control-label`, `.pounce-control-description`

---

### Radio

Labeled radio button. Group with shared `name` attribute.

```tsx
import { Radio } from '@pounce/ui'

<Radio name="color" value="red" label="Red" />
<Radio name="color" value="blue" label="Blue" checked={true} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string \| JSX.Element` | — | Label text |
| `description` | `string \| JSX.Element` | — | Helper text |
| `variant` | `string` | `'primary'` | Accent color variant |
| `name` | `string` | — | Radio group name |
| `value` | `string` | — | Radio value |
| `checked` | `boolean` | — | Selected state |

**Adapter key**: `Radio` (`BaseAdaptation`)  
**CSS classes**: `.pounce-control`, `.pounce-radio`, `.pounce-control-input`

---

### Switch

Toggle switch with optional label positioning.

```tsx
import { Switch } from '@pounce/ui'

<Switch label="Dark mode" />
<Switch label="Notifications" labelPosition="start" checked={true} />
<Switch variant="success" label="Active" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string \| JSX.Element` | — | Label text |
| `description` | `string \| JSX.Element` | — | Helper text |
| `variant` | `string` | `'primary'` | Accent color variant |
| `labelPosition` | `'start' \| 'end'` | `'end'` | Label placement relative to switch |
| `checked` | `boolean` | — | On/off state |

**Adapter key**: `Switch` (`BaseAdaptation`)  
**CSS classes**: `.pounce-control`, `.pounce-switch`, `.pounce-switch-input`, `.pounce-switch-label-start`

---

### Multiselect

Dropdown multi-selection using `<details>`/`<summary>`.

```tsx
import { Multiselect } from '@pounce/ui'

const selected = new Set<string>()

<Multiselect
  items={['Red', 'Green', 'Blue']}
  value={selected}
  renderItem={(item, checked) => <span>{checked ? '✓ ' : ''}{item}</span>}
>
  <Button>Pick colors</Button>
</Multiselect>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | — | Available options |
| `value` | `Set<T>` | — | Selected items (mutated in place) |
| `renderItem` | `(item: T, checked: boolean) => JSX.Element \| false` | — | Item renderer. Return `false` to hide. |
| `closeOnSelect` | `boolean` | `true` | Close dropdown after selection |
| `variant` | `string` | `'primary'` | Variant name |
| `children` | `JSX.Element` | — | Trigger element (rendered in `<summary>`) |

**Adapter key**: `Multiselect` (`BaseAdaptation`)  
**CSS classes**: `.pounce-multiselect`, `.pounce-multiselect-menu`

---

### Badge

Small status label. Uppercase, compact.

```tsx
import { Badge } from '@pounce/ui'

<Badge>New</Badge>
<Badge.success icon="check">Verified</Badge.success>
<Badge.danger>Error</Badge.danger>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tag` | `string` | `'span'` | HTML element tag |
| `variant` | `string` | `'primary'` | Variant name |
| `icon` | `string \| JSX.Element` | — | Leading icon |

**Adapter key**: `Badge` (`BaseAdaptation`)  
**CSS classes**: `.pounce-badge`, `.pounce-token-icon`, `.pounce-token-label`

---

### Pill

Medium status indicator with optional leading and trailing icons.

```tsx
import { Pill } from '@pounce/ui'

<Pill>Active</Pill>
<Pill icon="user" trailingIcon="chevron-right">John Doe</Pill>
<Pill.warning>Pending</Pill.warning>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tag` | `string` | `'span'` | HTML element tag |
| `variant` | `string` | `'primary'` | Variant name |
| `icon` | `string \| JSX.Element` | — | Leading icon |
| `trailingIcon` | `string \| JSX.Element` | — | Trailing icon |

**Adapter key**: `Pill` (`BaseAdaptation`)  
**CSS classes**: `.pounce-pill`, `.pounce-token-icon`, `.pounce-token-label`

---

### Chip

Interactive token — clickable, optionally dismissible.

```tsx
import { Chip } from '@pounce/ui'

<Chip>Tag</Chip>
<Chip dismissible onDismiss={() => console.log('removed')}>Remove me</Chip>
<Chip.secondary icon="tag" dismissible>Category</Chip.secondary>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tag` | `string` | `'button'` | HTML element tag |
| `variant` | `string` | `'secondary'` | Variant name |
| `icon` | `string \| JSX.Element` | — | Leading icon |
| `dismissible` | `boolean` | `false` | Show dismiss button |
| `dismissLabel` | `string` | `'Remove'` | Dismiss button aria-label |
| `onDismiss` | `() => void` | — | Dismiss callback |

**Adapter key**: `Chip` (`BaseAdaptation`)  
**CSS classes**: `.pounce-chip`, `.pounce-chip-dismiss`, `.pounce-token-icon`, `.pounce-token-label`

---

### Stars

Star rating with single value or range selection.

```tsx
import { Stars } from '@pounce/ui'

<Stars value={3} onChange={(v) => console.log(v)} />
<Stars value={[2, 4]} maximum={10} onChange={(range) => console.log(range)} />
<Stars value={4} readonly />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number \| [number, number]` | `0` | Current value or range |
| `maximum` | `number` | `5` | Number of stars |
| `onChange` | `(value) => void` | — | Value change callback |
| `readonly` | `boolean` | `false` | Disable interaction |
| `size` | `string` | `'1.5rem'` | Star icon size |
| `before` | `string` | `'star-filled'` | Icon for filled stars |
| `after` | `string` | `'star-outline'` | Icon for empty stars |
| `inside` | `string` | — | Icon for range interior (defaults to `before`) |
| `zeroElement` | `string` | — | Icon for "zero" position |

**Adapter key**: `Stars` (`BaseAdaptation`)  
**CSS classes**: `.pounce-stars`, `.pounce-stars-item`, `.pounce-readonly`, `.pounce-before`, `.pounce-inside`  
**Interaction**: Click to set value. Drag to adjust range endpoints. Double-click to collapse range.

---

### InfiniteScroll

Virtualized scrollable list rendering only visible items. Supports both **fixed-height** (fast path) and **variable-height** (measured) items.

```tsx
import { InfiniteScroll } from '@pounce/ui'

// Fixed height — fast path, no measurement overhead
<InfiniteScroll items={largeArray} itemHeight={40} stickyLast>
  {(item, index) => <div>{index}: {item.name}</div>}
</InfiniteScroll>

// Variable height — items measured via ResizeObserver
<InfiniteScroll items={messages} itemHeight={(msg) => msg.hasImage ? 200 : 48}>
  {(msg) => <MessageBubble message={msg} />}
</InfiniteScroll>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | — | Data array |
| `itemHeight` | `number \| (item: T, index: number) => number` | — | Fixed height (number) or per-item estimator (function) |
| `estimatedItemHeight` | `number` | `40` | Fallback height for unmeasured items (variable mode only) |
| `stickyLast` | `boolean` | `true` | Auto-scroll to bottom on new items |
| `el` | `JSX.GlobalHTMLAttributes` | — | Pass-through HTML attributes for scroll container |
| `children` | `(item: T, index: number) => JSX.Element` | — | Row renderer |

**Fixed mode** (`itemHeight: number`): uses simple arithmetic for virtualization. Items get `contain: strict` for maximum performance.

**Variable mode** (`itemHeight: function`): uses a prefix-sum offset array with binary search for O(log n) visible range lookup. Each rendered item is observed via `ResizeObserver`; when actual heights differ from estimates, offsets are recalculated and scroll position is anchored to prevent content jumps.

**Adapter key**: `InfiniteScroll` (`BaseAdaptation`)  
**CSS classes**: `.pounce-infinite-scroll`, `.pounce-infinite-scroll-content`, `.pounce-infinite-scroll-item`, `.pounce-infinite-scroll-item--fixed`  
**Directives used**: `resize`, `scroll`

---

### ErrorBoundary

Catches errors thrown by child components during render and reactive effects.

```tsx
import { ErrorBoundary } from '@pounce/ui'

<ErrorBoundary fallback={(error) => <div>Error: {error.message}</div>}>
  <RiskyComponent />
</ErrorBoundary>
```

See also: `ProductionErrorBoundary` for a simpler fallback.

---

### Layout

Flexbox and grid layout primitives. All support adapter class overrides via `getAdapter('Layout')`.

```tsx
import { Stack, Inline, Grid, Container, AppShell } from '@pounce/ui'

<Stack gap="lg" align="center">
  <Heading>Title</Heading>
  <Text>Body text</Text>
</Stack>

<Inline gap="sm" wrap>
  <Button>A</Button>
  <Button>B</Button>
</Inline>

<Grid columns={3} gap="md">
  <Card /><Card /><Card />
</Grid>

<Grid minItemWidth="250px">
  {items.map(item => <Card />)}
</Grid>
```

#### Stack

Vertical flex container.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gap` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| string` | `'md'` | Spacing between children |
| `align` | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch'` | — | Cross-axis alignment |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | — | Main-axis distribution |

**Adapter key**: `Layout` — `classes.base` overrides `.pounce-stack`

#### Inline

Horizontal flex container with center-aligned items.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gap` | `SpacingToken` | `'sm'` | Spacing between children |
| `align` | same as Stack | `'center'` | Cross-axis alignment |
| `justify` | same as Stack | — | Main-axis distribution |
| `wrap` | `boolean` | `false` | Allow wrapping |
| `scrollable` | `boolean` | `false` | Horizontal scroll overflow |

**Adapter key**: `Layout` — `classes.inline` overrides `.pounce-inline`

#### Grid

CSS grid container with auto-fit support.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gap` | `SpacingToken` | `'md'` | Grid gap |
| `columns` | `number \| string` | — | Column template (`3` → `repeat(3, minmax(0, 1fr))`) |
| `minItemWidth` | `string` | — | Auto-fit with min width (`'250px'` → `repeat(auto-fit, minmax(250px, 1fr))`) |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | — | Align items |
| `justify` | `'start' \| 'center' \| 'end' \| 'stretch'` | — | Justify items |

**Adapter key**: `Layout` — `classes.grid` overrides `.pounce-grid`

#### Container / AppShell

- **Container**: Max-width wrapper. `fluid` prop switches to full-width.
- **AppShell**: Page shell with sticky header (shadow on scroll) and main content area.

```tsx
<AppShell header={<Navbar />}>
  <Container>
    <Stack>{/* page content */}</Stack>
  </Container>
</AppShell>
```

---

### Typography

Semantic text components with variant support, adapter class overrides, and trait application.

```tsx
import { Heading, Text, Link } from '@pounce/ui'

<Heading level={1} variant="primary">Page Title</Heading>
<Text size="lg" muted>Subtitle text</Text>
<Link href="/about" variant="secondary">Learn more</Link>
```

#### Heading

Renders `<h1>`–`<h6>` with level-based sizing and variant colors.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` | Heading level (clamped to 1–6) |
| `tag` | `string` | `h{level}` | Override HTML tag (e.g., `'div'` for visual heading without semantic) |
| `variant` | `string` | `'primary'` | Color variant (adapter trait or fallback CSS class) |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Text alignment |
| `el` | `object` | — | Extra HTML attributes passed to the element |

**Adapter key**: `Heading` — `classes.base` overrides `.pounce-heading`  
**CSS classes**: `.pounce-heading`, `.pounce-heading-level-{1-6}`, `.pounce-heading-variant-{name}`, `.pounce-heading-align-{center|end}`

#### Text

Paragraph text with size tokens and muted option.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tag` | `string` | `'p'` | HTML tag |
| `variant` | `string` | `'primary'` | Color variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Font size |
| `muted` | `boolean` | `false` | Reduced opacity color |
| `el` | `object` | — | Extra HTML attributes |

**Adapter key**: `Text` — `classes.base` overrides `.pounce-text`  
**CSS classes**: `.pounce-text`, `.pounce-text-{sm|md|lg}`, `.pounce-text-muted`, `.pounce-text-variant-{name}`

#### Link

Anchor element with variant styling and underline control. Uses kit's `<A>` for SPA-aware routing.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `string` | `'primary'` | Color variant |
| `underline` | `boolean` | `true` | Show text underline |
| + all `<a>` attributes | | | `href`, `target`, `rel`, etc. |

**Adapter key**: `Link` — `classes.base` overrides `.pounce-link`  
**CSS classes**: `.pounce-link`, `.pounce-link-variant-{name}`, `.pounce-link-no-underline`

---

### Other Components

| Component | Description |
|-----------|-------------|
| **Icon** | Renders icons via adapter `iconFactory`. Falls back to text. |
| **Menu** | Dropdown menu with keyboard navigation. |
| **Toolbar** | Horizontal/vertical toolbar with spacers. |
| **RadioButton** | Radio-style button with icon support. |
| **DockView** | Window management via dockview-core. |
| **Dialog / Toast / Drawer** | Overlay components via `StandardOverlays`. |

---

## Display Context

Scope-based theming, direction, and locale — nestable, reactive, and separate from the adapter system.

### DisplayProvider

Sets `data-theme`, `dir`, and `lang` on its own DOM element. Supports nesting: child providers inherit from parent, overriding only specified axes. All axes default to `'auto'` (inherit from parent, or system defaults at root).

```tsx
import { DisplayProvider, ThemeToggle, Button } from '@pounce/ui'

const App = () => (
  <DisplayProvider>
    <ThemeToggle />
    <Button>Themed Button</Button>
  </DisplayProvider>
)
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `string \| 'auto'` | `'auto'` | Theme setting. `'auto'` inherits from parent or OS preference. |
| `direction` | `'ltr' \| 'rtl' \| 'auto'` | `'auto'` | Text direction. `'auto'` inherits from parent or document. |
| `locale` | `string \| 'auto'` | `'auto'` | Locale. `'auto'` inherits from parent or browser language. |
| `onThemeChange` | `(theme: string) => void` | — | Called when theme setting changes (for persistence). |

**CSS classes**: `.pounce-display-provider` (uses `display: contents` — zero layout impact)  
**DOM attributes**: `data-theme`, `dir`, `lang` — set on the wrapper element, CSS cascades naturally.

#### Nested Contexts

```tsx
<DisplayProvider theme="light" direction="ltr">
  <h1>English Interface</h1>

  {/* Arabic section inside English UI */}
  <DisplayProvider direction="rtl" locale="ar-SA">
    <h2>محتوى عربي</h2>
    <Button>زر عربي</Button>
  </DisplayProvider>

  <Button>Back to English</Button>
</DisplayProvider>
```

#### With Persistence

```tsx
import { stored } from '@pounce/kit'

const App = () => {
  const prefs = stored({ theme: 'auto' })
  return (
    <DisplayProvider theme={prefs.theme} onThemeChange={(t) => prefs.theme = t}>
      <ThemeToggle />
    </DisplayProvider>
  )
}
```

#### useDisplayContext

Read the current display context from scope. Falls back to system defaults if no `DisplayProvider` is present.

```tsx
import { useDisplayContext } from '@pounce/ui'
import type { Scope } from '@pounce/core'

function MyComponent(_props: {}, scope: Scope) {
  const display = useDisplayContext(scope)
  // display.theme, display.direction, display.locale, display.themeSetting, display.setTheme
}
```

---

### ThemeToggle

Split-button UX for theme switching. Main button toggles dark↔light, dropdown arrow opens menu with auto/dark/light options.

```tsx
import { ThemeToggle } from '@pounce/ui'

<ThemeToggle />              {/* Full: toggle + dropdown */}
<ThemeToggle simple />        {/* Simple: toggle only, no auto option */}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icons` | `Record<string, JSX.Element \| string>` | `{ light: 'sun', dark: 'moon' }` | Custom icons per theme |
| `labels` | `Record<string, string>` | `{ light: 'Light', dark: 'Dark' }` | Custom labels per theme |
| `autoLabel` | `string` | `'Auto'` | Label for the auto option |
| `simple` | `boolean` | `false` | Hide dropdown (simple toggle only) |
| `themes` | `string[]` | — | Additional themes beyond dark/light |
| `el` | `JSX.GlobalHTMLAttributes` | — | Pass-through HTML attributes |

**4 visual states**:

| Setting | Resolved | Icon | Label |
|---------|----------|------|-------|
| `'dark'` | dark | moon | "Dark" |
| `'light'` | light | sun | "Light" |
| `'auto'` | dark | moon + A badge | "Auto (Dark)" |
| `'auto'` | light | sun + A badge | "Auto (Light)" |

**CSS classes**: `.pounce-theme-toggle`, `.pounce-theme-toggle-main`, `.pounce-theme-toggle-dropdown`, `.pounce-theme-toggle-menu`, `.pounce-theme-toggle-option`, `.pounce-theme-toggle-auto-badge`

---

## Adapter System

```tsx
import { setAdapter } from '@pounce/ui'

setAdapter({
  // Variant traits (classes + ARIA)
  variants: {
    primary: { classes: ['btn-primary'] },
    danger: { classes: ['btn-danger'], attributes: { 'aria-live': 'assertive' } },
  },
  // Global icon renderer
  iconFactory: (name, size) => <i class={`icon-${name}`} style={`font-size:${size}`} />,
  // Per-component class overrides
  components: {
    Button: { classes: { base: 'my-btn', label: 'my-btn-label' } },
    CheckButton: { classes: { base: 'my-toggle', checked: 'my-toggle-on' } },
  },
  // Transition defaults
  transitions: { duration: 200, enterClass: 'fade-in', exitClass: 'fade-out' },
})
```

Adapters are composable — call `setAdapter()` multiple times to layer concerns (icons, variants, component classes).

## Build Configuration

```typescript
import { defineConfig } from 'vite'
import { pounceUIPackage } from '@pounce/plugin/packages'

export default defineConfig({
  plugins: [
    ...pounceUIPackage({
      ui: {
        core: {
          jsxRuntime: { runtime: 'automatic', importSource: '@pounce/core' }
        }
      }
    })
  ]
})
```

This provides:
- JSX transformation with reactive enhancements
- CSS/SASS layer wrapping (`@layer pounce.components`)
- Forbidden variable validation (prevents `--pico-*` usage)
- TypeScript declaration generation

## Development

This package is part of the Pounce monorepo. See the root README for development setup.

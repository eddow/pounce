# @pounce/adapter-pico

PicoCSS framework adapter for `@pounce/ui`.

## Installation

```bash
pnpm add @pounce/adapter-pico @picocss/pico
```

## Usage

```typescript
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'
import '@pounce/adapter-pico/css'       // Variable bridge: --pounce-* → --pico-*
import '@picocss/pico/css/pico.min.css' // PicoCSS itself

setAdapter(picoAdapter)
```

## What It Provides

### Variants (Trait objects)

| Variant      | Pico Class   | Custom CSS | Notes                              |
|-------------|-------------|------------|-------------------------------------|
| `primary`   | *(default)* | No         | Pico's default button style         |
| `secondary` | `.secondary`| No         | Pico built-in                       |
| `contrast`  | `.contrast` | No         | Pico built-in                       |
| `outline`   | `.outline`  | No         | Pico built-in                       |
| `danger`    | `.pounce-pico-danger`  | Yes | Custom, extends Pico's design |
| `success`   | `.pounce-pico-success` | Yes | Custom, extends Pico's design |
| `warning`   | `.pounce-pico-warning` | Yes | Custom, extends Pico's design |

### Component Configs (23 components)

Per-component class and transition overrides:

- **Buttons**: Button, CheckButton, RadioButton, ButtonGroup
- **Forms**: Select, Combobox, Checkbox, Radio, Switch
- **Dropdowns**: Menu, Multiselect
- **Tokens**: Badge, Pill, Chip
- **Data**: Stars
- **Typography**: Heading, Text, Link
- **Layout**: Stack, Inline, Grid, Container
- **Toolbar**
- **Overlays**: Dialog (200ms), Toast (300ms), Drawer (300ms)

### CSS Variable Bridge

The bridge CSS (`@pounce/adapter-pico/css`) remaps `--pounce-*` variables to `--pico-*`:

| Pounce Variable          | Pico Variable                    |
|--------------------------|----------------------------------|
| `--pounce-primary`       | `--pico-primary`                 |
| `--pounce-secondary`     | `--pico-secondary`               |
| `--pounce-contrast`      | `--pico-contrast`                |
| `--pounce-spacing`       | `--pico-spacing`                 |
| `--pounce-border-radius` | `--pico-border-radius`           |
| `--pounce-form-height`   | `--pico-form-element-height`     |
| `--pounce-bg`            | `--pico-background-color`        |
| `--pounce-fg`            | `--pico-color`                   |
| `--pounce-border`        | `--pico-muted-border-color`      |

The bridge also re-resolves inside nested `[data-theme]` elements, so `<article data-theme="dark">` works correctly with all pounce components inside it.

### Transitions

Global default: 200ms ease. Per-component overrides for Dialog (200ms), Toast (300ms), Drawer (300ms).

## Pico-Native Directives

### `use:tooltip` — Pure-CSS Tooltips

PicoCSS provides tooltips via `data-tooltip` with no JavaScript. This adapter exports a directive to set them declaratively:

```typescript
import { tooltip } from '@pounce/adapter-pico'

// String shorthand
<button use:tooltip="Save">💾</button>

// With placement
<button use:tooltip={{ text: 'Delete', placement: 'bottom' }}>🗑️</button>
```

Placements: `top` (default), `right`, `bottom`, `left`.

## Pico-Native Free Features

These PicoCSS features work automatically when using this adapter — no extra code needed:

### Tooltips (via `el={}`)

Any element can get a Pico tooltip without the directive:

```typescript
<Button el={{ 'data-tooltip': 'Save' }}>💾</Button>
```

### `<nav>` Layout

Wrap your menu in `<nav>` and Pico distributes `<ul>` items horizontally with proper link styling:

```typescript
<nav>
  <ul><li><strong>App</strong></li></ul>
  <ul>
    <li><a href="/about">About</a></li>
    <li><a href="/docs">Docs</a></li>
  </ul>
</nav>
```

### `<article>` as Card

Pico styles `<article>` as a card with `<header>` and `<footer>` sections — no classes needed.

### `<progress>` Bar

Pico styles `<progress>` natively (determinate and indeterminate).

### Dark/Light Scoping

Use `data-theme="dark"` or `data-theme="light"` on any element to override the color scheme for that subtree. The bridge CSS re-resolves all `--pounce-*` variables inside themed elements.

## Composability

This adapter only provides framework styling. Combine with icon adapters using variadic `setAdapter`:

```typescript
import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'
import { glyfIcons } from '@pounce/adapter-icons-glyf'

setAdapter(picoAdapter, glyfIcons)  // Merges left-to-right
```

## Development

```bash
pnpm install
pnpm run build
pnpm run test
```

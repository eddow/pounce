# CSS Template Tags

Inline CSS processing using template tag functions that are transformed at build time through Vite's PostCSS pipeline.

## Overview

The CSS template tag system allows you to write CSS directly in your TypeScript/TSX files using template literals. The CSS is automatically processed through Vite's PostCSS pipeline (autoprefixer, etc.) and injected into the document head at runtime.

## Installation

The CSS template tag functions are available from `./lib/css`:

```ts
import { css, sass, scss } from './lib/css'
```

## Basic Usage

### Plain CSS

Use the `css` tag for plain CSS:

```ts
css`.my-class { 
  color: red; 
  font-weight: bold;
}`
```

### SASS (indented syntax)

Use the `sass` tag for the **indented SASS syntax** (Python‑like, no braces, no semicolons) with nesting, variables, and mixins:

```ts
sass`
.container
  color: blue
  padding: 1rem

  &:hover
    color: darkblue

  .nested
    font-size: 1.2em
`
```

### SCSS (curly-brace syntax)

Use the `scss` tag for standard SCSS syntax (curly braces and semicolons):

```ts
scss`
.container {
  color: blue;
  padding: 1rem;

  &:hover {
    color: darkblue;
  }

  .nested {
    font-size: 1.2em;
  }
}
`
```

## How It Works

1. **Build Time**: The Vite plugin (`vite-plugin-css-tag`) transforms template literals into processed CSS imports
2. **Processing**: CSS is processed through Vite's PostCSS pipeline (autoprefixer, etc.)
3. **SASS Compilation**: SASS (indented syntax) is compiled using the `sass` compiler
4. **Runtime**: Processed CSS is automatically injected into the document head

## Syntax Highlighting

For syntax highlighting in VS Code/Cursor, install the **es6-string-html** extension:

**Extension**: [es6-string-html](https://open-vsx.org/extension/Tobermory/es6-string-html)

This extension automatically detects `css`, `sass`, and `scss` tags in template literals and provides proper syntax highlighting without any configuration.

## Limitations

- **No Template Interpolation**: Template string interpolation (e.g., `${variable}`) is not yet supported. Use static template strings only.
- **Global Injection**: CSS is injected globally into the document head. Scoped styles are not currently supported.

## Examples

### Component Styles

```tsx
import { css } from './lib/css'

// Define styles at module level
css`
  .my-component {
    display: flex;
    gap: 1rem;
  }
  
  .my-component-title {
    font-size: 1.5rem;
    font-weight: bold;
  }
`

export const MyComponent = () => (
  <div class="my-component">
    <h2 class="my-component-title">Title</h2>
  </div>
)
```

### SASS with Nesting (indented syntax)

```tsx
import { sass } from './lib/css'

sass`
.card
  border: 1px solid var(--pico-border-color)
  border-radius: var(--pico-border-radius)
  padding: 1rem

  &:hover
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)

  .card-header
    font-weight: bold
    margin-bottom: 0.5rem

  .card-body
    color: var(--pico-muted-color)
`
```

## Migration from .scss Files

You can replace `.scss` file imports with inline CSS template tags:

**Before:**
```tsx
import './button.scss'

export const Button = () => <button class="pp-button">Click</button>
```

**After:**
```tsx
import { css } from './lib/css'

css`
  .pp-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
`

export const Button = () => <button class="pp-button">Click</button>
```


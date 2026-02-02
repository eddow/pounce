# @pounce/ui

Framework-agnostic UI component library for Pounce applications.

## Status

🚧 **Under Development** - This package is being created as a framework-agnostic evolution of `@pounce/pico`.

## Architecture

See the [analysis documentation](./analysis/README.md) for a comprehensive overview of the architectural decisions and migration strategy.

## Goals

- **Framework-agnostic**: Works with any CSS framework (PicoCSS, Tailwind, vanilla CSS, etc.)
- **Fully configurable**: Every structural and styling decision can be overridden
- **SSR-ready**: Follows Pounce's dual entry-point architecture
- **Accessible**: WCAG 2.1 AA compliant components
- **Type-safe**: Full TypeScript support

## Planned Components

- Button, RadioButton, CheckButton
- ComboBox, MultiSelect, Select
- Dialog, Toast, Alert
- Menu, Toolbar, ButtonGroup
- DockView (window management)
- Layout utilities (Stack, Inline, Grid)
- And more...

## Adapters

- `@pounce/ui-pico` - PicoCSS integration (maintains backward compatibility with `@pounce/pico`)
- `@pounce/ui-tailwind` - Tailwind CSS integration
- `@pounce/ui-vanilla` - Standalone CSS without framework dependencies

## Development

This package is part of the Pounce monorepo. See the root README for development setup.

# @pounce/ui LLM Cheat Sheet

## Overview
Framework-agnostic UI component library for Pounce applications. Evolved from `@pounce/pico` to support any CSS framework.

## Architecture
- **Core Package**: `@pounce/ui` - Components with minimal styling and CSS variable contract
- **Adapters**: Framework-specific integrations (`@pounce/ui-pico`, `@pounce/ui-tailwind`, etc.)
- **Configuration**: Maximum configurability - every structural and styling decision can be overridden

## Key Principles
1. **Framework-agnostic**: No hard dependency on any CSS framework
2. **CSS Variable Contract**: Uses `--pounce-*` variables with fallbacks
3. **Adapter Pattern**: Framework-specific code lives in separate adapter packages
4. **SSR-ready**: Follows Pounce's dual entry-point architecture
5. **Fully Configurable**: Classes, structure, events, transitions all configurable

## ⚠️ Critical
- **SSR Safety**: `@pounce/ui` works in SSR. Kit uses dual entry-points (auto-selects `kit/dom` or `kit/node`)

## Documentation
See `./analysis/README.md` for comprehensive architectural analysis and migration strategy.

## Status
🚧 Under development - not yet ready for production use.

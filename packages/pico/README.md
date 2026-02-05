# Pounce UI

DEPRECATED/TAGGED FOR DELETION - The project remains for reference only!

Minimal UI utilities built on PicoCSS and @pounce/core.

## Documentation

See the docs per topic in `/docs`:

- [Alert](./docs/alert.md)
- [Badged](./docs/badged.md)
- [Button](./docs/button.md)
- [CSS Template Tags](./docs/css.md)
- [Dialog](./docs/dialog.md)
- [Dockview](./docs/dockview.md)
- [Forms](./docs/forms.md)
- [Icons and Variants](./docs/icons-variants.md)
- [Layout](./docs/layout.md)
- [Menu](./docs/menu.md)
- [Stars](./docs/stars.md)
- [Status](./docs/status.md)
- [Toast](./docs/toast.md)
- [Toolbar](./docs/toolbar.md)
- [Typography](./docs/typography.md)
- [Actions (Directives)](./docs/actions.md)

## TODOs

- [ ] Make one plugin to rule them all.
	Basically, the @pounce/pico plugin should initialize and use all the @pounce/core, pure-glyf, pico, etc. plugins.

- Form primitives
	- Accessible `Field`, `Label`, `Description`, `Error` scaffolding
	- Consistent sizes/variants via `src/components/variants.ts`
	- Error dictionary integration and toast-on-error option
	- Inputs: Text, Textarea, Select, Switch, Range/Slider

- Date/Time picker
	- Keyboard-accessible calendar grid with range selection
	- Min/max, disabled dates, presets, and i18n
	- Time selection (HH:MM) and combined date-time

- Toast enhancements
	- Queueing and max-visible with viewport stacking
	- Actions (undo/retry) and optional progress
	- Programmatic API and grouped categories

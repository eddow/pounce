# Pico Adapter — TODO

## Completed

- [x] Bridge CSS for Badge/Pill/Chip base styles (bypass @layer)
- [x] Bridge CSS for Link no-underline override
- [x] Bridge CSS for dismissible Chip `[role=group]` width reset
- [x] Bridge CSS for Toolbar/Inline/Stack layout base styles (bypass @layer)
- [x] Bridge CSS for heading margin reset inside Toolbar
- [x] Typography variant colors via `[data-variant]` (Heading, Text, Link)
- [x] Demo shell refactored to use Toolbar, Container, Inline, Link, Heading

## DisplayProvider / ThemeToggle Adaptation

- [ ] **dp1** Verify `data-theme` scoping — section 13 of bridge already remaps `--pounce-*` inside `[data-theme]`. Confirm Pico's native `[data-theme="dark"]` cascades correctly on the `<div>` that `DisplayProvider` renders (not just on `:root`).
- [ ] **dp2** ThemeToggle bridge CSS — `.pounce-theme-toggle` and children (`.pounce-theme-toggle-main`, `-dropdown`, `-menu`, `-option`, `-auto-badge`) are injected via `componentStyle` (`@layer`), so Pico overrides them. Replicate base styles in bridge CSS, same pattern as tokens/toolbar.
- [ ] **dp3** Adapter `components.ts` — check if ThemeToggle needs a component config entry (class mappings). Likely minimal or none.
- [ ] **dp4** Wire into demo shell — wrap app in `<DisplayProvider>`, add `<ThemeToggle>` to the Toolbar in `shared.tsx`. Both vanilla and Pico demos benefit.
- [ ] **dp5** Persistence — use `stored()` from `@pounce/kit` for localStorage-backed theme preference. Wire `onThemeChange` in demo `main.tsx`.
- [ ] **dp6** Verify Pico's `[data-theme]` works on any element (not just `:root`/`html`). This is the key integration point — Pico assigns CSS variables per `[data-theme]` on any element.
- [ ] **dp7** Visual verification — ThemeToggle renders correctly in Pico demo, toggle works, dropdown menu styled, dark/light switch applies Pico theming.

## Notes

- Pico's `@layer` problem: `componentStyle` injects into `@layer pounce.components`, which Pico's unlayered styles always beat. Every pounce component that needs to look correct under Pico needs its base styles replicated in `pico-bridge.sass` (unlayered).
- `DisplayProvider` sets `data-theme` on its own `<div class="pounce-display-provider">` — Pico's `[data-theme="dark"]` CSS variables cascade to children.
- `ThemeToggle` reads `useDisplayContext(scope)` and calls `display.setTheme()`.
- `DisplayContext` type: `{ theme, themeSetting, direction, locale, setTheme }`.

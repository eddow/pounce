# Pico Adapter — TODO

## Completed

- [x] Bridge CSS for Badge/Pill/Chip base styles (bypass @layer)
- [x] Bridge CSS for Link no-underline override
- [x] Bridge CSS for dismissible Chip `[role=group]` width reset
- [x] Bridge CSS for Toolbar/Inline/Stack layout base styles (bypass @layer)
- [x] Bridge CSS for heading margin reset inside Toolbar
- [x] Typography variant colors via `[data-variant]` (Heading, Text, Link)
- [x] Demo shell refactored to use Toolbar, Container, Inline, Link, Heading
- [x] `createGlyfIconFactory()` helper in `src/icons.tsx` — bridges pure-glyf → adapter `iconFactory`
- [x] `pureGlyfPlugin` wired in Pico demo `vite.config.ts` (points directly at `@tabler/icons/icons/outline`) + `mount()` + `iconFactory` in `main.tsx`
- [x] DisplayProvider + ThemeToggle wired into demo shell (by compys)
- [x] ThemeToggle bridge CSS (section 15) — all sub-elements styled with Pico variables
- [x] DisplayProvider bridge CSS — `display: contents`

- [x] **Theme class audit** — Fixed: `--pounce-bg-muted` was never defined (tokens, progress, hover states all invisible in dark mode). Added `color-mix(in srgb, --pico-color 8%, transparent)` to `:root` + `[data-theme]`. Also added missing `--pounce-muted-border` and `--pounce-fg-inverse` to `[data-theme]` block.

- [x] **`.pounce-input-inline`** — Bridge CSS utility (section 15) overriding Pico's block input defaults
- [x] **Theme persistence** — `stored()` from `@pounce/kit` wired in shared demo shell (`DisplayProvider` + `onThemeChange`)

- [x] **Overlay bridge CSS** (section 18) — Dialog, Toast, Drawer: Pico card vars, close button resets, backdrop blur, drawer width
- [x] **`aria-current="page"` pill** — primary-bg pill for active nav links

## Pending

(none — all current tasks complete)

## Known issues (not in pico-tee scope)

- `toast.danger()` / `toast.warning()` called in demo but `bindToast` only exports `.success` / `.error` / `.warn` / `.info` — method name mismatch (→ compys)
- Drawer demo passes `body` prop but `DrawerOptions` expects `children` (→ compys)

## Notes

- **The Pico demo doubles as a Pico + pure-glyf integration demo.** It showcases how to wire `pureGlyfPlugin` + `createGlyfIconFactory()` + Tabler icons into a real Pounce app with the Pico adapter.
- **pure-glyf** generates CSS class names from SVGs. Each icon = `"pure-glyf-icon glyf-<prefix>-<name>"`. Apply as `class` on a `<span>`.
- **`iconFactory`** signature: `(name: string, size: string | number | undefined, context: DisplayContext) => JSX.Element`
- The adapter itself doesn't bundle icons — the consuming app configures which icon set to use via `pureGlyfPlugin` + the icon map passed to `createGlyfIconFactory()`.
- Pico's `@layer` problem: `componentStyle` injects into `@layer pounce.components`, which Pico's unlayered styles always beat.
- `DisplayProvider` sets `data-theme` on its own `<div>` — Pico's `[data-theme="dark"]` CSS variables cascade to children.
- `DisplayContext` type: `{ theme, themeSetting, direction, locale, setTheme }`.

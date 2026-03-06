# UI E2E Tests TODO

## Tested

### UiGaps.test.ts (individual component demos)
- [x] **Button** - click counter and disabled state
- [x] **Checkbox** - checked/unchecked/indeterminate/disabled states
- [x] **Select** - value changes on selection
- [x] **Overlay / Dialog** - open + close with cancel/confirm actions
- [x] **Accordion** - exclusive + multi-open behavior, programmatic open/clear
- [x] **Menu** - open/close and outside click dismiss
- [x] **CheckButton** - standalone primitive toggles with aria + state readouts
- [x] **Drawer** - left/right open, close button, backdrop dismiss
- [x] **Toast** - trigger variants, text rendering, manual dismiss
- [x] **MultiSelect** - render guard (no page errors), select + clear all
- [x] **Progress** - value updates, indeterminate progress present
- [x] **Stars** - concrete rating/range updates with deterministic assertions
- [x] **DisplayContext** - section is rendered with controls and context readouts

### FormDemo.test.ts (cross-component interaction)
- [x] **Button** - clicks, disabled toggle, re-enable
- [x] **Checkbox** - group with master/indeterminate, select-all/clear-all
- [x] **RadioButton + Select** - shared reactive value, radio→select and select→radio sync

## Missing E2E Tests

### High Priority
- [x] **Toast** - deterministic auto-dismiss assertion
- [x] **Dialog** - assert resolved result payloads from action paths

### Medium Priority
- [x] **Stars** - assert concrete rating/range updates (not just surface interaction)
- [x] **DisplayContext** - assert reactive locale/direction/theme propagation end-to-end
- [x] **CheckButton** - keep standalone primitive regression (Form demo already covers cross-component)

## Known Demo Issues (reported)

- [x] **MultiSelect** - throws on display
- [x] **Stars** - throws on display
- [x] **Toast** - rendered toasts miss expected text content
- [x] **Drawer** - does not appear on click
- [x] **Dialog** - not currently exercised in dedicated E2E flow
- [x] **DisplayContext** - demo naming/section shape aligned with intended display context scope
- [x] **Toast** - auto-dismiss behavior is not deterministic enough for strict E2E assertion yet
- [x] **DisplayContext** - display context values reflect theme/direction/locale toggles in E2E

### Accessibility
- [x] ARIA attributes on radio buttons, checkboxes, menus
- [x] Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- [x] Focus trapping in overlays/drawers

### User-given issues (--> e2e)
- [x] Toasts don't fade (animation ineffective)
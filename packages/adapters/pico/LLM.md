# @pounce/adapter-pico LLM Cheat Sheet

## Overview
PicoCSS adapter for `@pounce/ui` v2. Provides styled components using PicoCSS classes and CSS variables. Demonstrates adapter patterns and best practices.

## Architecture
```
@pounce/ui (headless)    @pounce/adapter-pico (styled)
├── useButton()      →   ├── Button = picoComponent(function Button(props) {
├── useCheckbox()    →   │   const state = useButton(props)
├── uiComponent()    →   │   return <button class={`btn btn-${props.variant}`} {...state.ariaProps}>
└── options          →   │ }
                      └── })
```

## Key Patterns

### 1. Component Factory
Create a factory once per adapter with your variant list:
```ts
import { uiComponent } from '@pounce/ui'

const picoComponent = uiComponent(['primary', 'secondary', 'danger', 'ghost'] as const)
```

### 2. Component Implementation
```ts
export const Button = picoComponent(function Button(props) {
  const state = useButton(props)
  
  return (
    <button 
      class={`btn btn-${props.variant ?? 'default'}`}
      disabled={props.disabled}
      onClick={state.onClick}
      aria-label={state.ariaProps['aria-label']}
      aria-disabled={state.ariaProps['aria-disabled']}
    >
      {props.children}
    </button>
  )
})
```

### 3. Icon Setup
```ts
import { options } from '@pounce/ui'
import { Icon } from '@tabler/icons-react'

options.iconFactory = (name, size) => (
  <Icon 
    name={name} 
    size={size} 
    style={{ width: size, height: size }} 
  />
)
```

### 4. Variant Mapping
PicoCSS uses simple BEM-like classes:
```css
.btn-primary { background: var(--pico-primary-color); }
.btn-secondary { background: var(--pico-secondary-color); }
.btn-danger { background: var(--pico-del-color); }
.btn-ghost { background: transparent; }
```

## Component List (Planned)
- [ ] Button
- [ ] Checkbox
- [ ] Radio
- [ ] Switch
- [ ] Select
- [ ] Combobox
- [ ] Input
- [ ] Textarea
- [ ] Card
- [ ] Accordion
- [ ] Modal
- [ ] Tabs
- [ ] Alert
- [ ] Badge
- [ ] Progress
- [ ] Spinner

## CSS Variables
PicoCSS already defines CSS variables. We extend with pounce-specific ones:
```css
:root {
  --pounce-spacing-xs: calc(var(--pounce-spacing) * 0.5);
  --pounce-spacing-sm: calc(var(--pounce-spacing) * 0.75);
  --pounce-spacing-lg: calc(var(--pounce-spacing) * 1.5);
  --pounce-border-radius-sm: calc(var(--pounce-border-radius) * 0.5);
}
```

## File Structure
```
src/
├── index.ts              # Barrel export
├── factory.ts            # picoComponent factory
├── setup.ts              # Icon factory registration
├── components/
│   ├── button.tsx
│   ├── checkbox.tsx
│   ├── card.tsx
│   └── ...
├── pico.sass            # PicoCSS + custom styles
└── demo/
    ├── index.tsx
    └── vite.config.ts
```

## Gotchas
1. **Class naming**: PicoCSS uses `.btn` for buttons, not `.button`
2. **Variants**: Always use `btn-{variant}` pattern
3. **States**: PicoCSS handles disabled/focus states automatically
4. **Icons**: Use Tabler Icons for consistency
5. **No SASS variables**: PicoCSS uses CSS variables only

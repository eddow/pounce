# Icons and Variants

## Icon

Thin wrapper around [pure-glyf](https://github.com/eddow/pure-glyf) icons.

```tsx
import { Icon } from '@pounce/pico'
import { tablerOutlineHome, tablerOutlineAlertCircle } from 'pure-glyf/icons'

<Icon icon={tablerOutlineHome} />
<Icon icon={tablerOutlineAlertCircle} size="24px" />
```

- `icon` is the pure-glyf icon class (imported from `pure-glyf/icons`).
- `size` accepts any CSS size (e.g., `24px`, `1.5rem`).

## Variants

Map semantic variants to Pico classes.

```ts
import { variantClass, type Variant } from '@pounce/pico'

const cls = variantClass('danger') // => 'danger'
```

Notes:
- `primary` (or undefined) returns an empty string, relying on Pico's default styles.
- Unsupported values map to `'secondary'`.

Available variants:
- `primary`, `secondary`, `contrast`, `danger`, `success`, `warning`

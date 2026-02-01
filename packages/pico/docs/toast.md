# Toasts

Lightweight notifications with a programmatic API.

## Basic

```ts
import { toast } from '@pounce/pico'

toast('Saved!')
```

## Variants and helpers

```ts
import { toastSuccess, toastWarning, toastDanger, toastInfo } from '@pounce/pico'

toastSuccess('Profile updated')
toastWarning('Network is slow')
toastDanger('Failed to save')
toastInfo('Heads up: maintenance at 2am')
```

## Options

```ts
import { toast } from '@pounce/pico'

toast({
	content: 'Longer message here',
	variant: 'success',
	durationMs: 5000, // 0 or negative to disable auto-dismiss
	dismissible: true,
	ariaRole: 'status', // or 'alert' (danger defaults to alert)
	class: 'my-toast',
})
```

## Behavior

- Auto-dismiss by default after ~3.5s; pauses on hover, resumes on mouse leave.
- Dismiss button when `dismissible` is true.
- Positioned bottom-right; stacked with small gap.

Customize visuals by overriding CSS in `src/components/variants.scss`.

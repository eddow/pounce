# Button

A headless button model with disabled-state handling, icon support, icon-only accessibility fallback, and dynamic tag support.

## Source API

The real exported type is `ButtonProps` from `src/models/button.tsx`.

```ts
type ButtonProps = VariantProps &
	IconProps &
	DisableableProps &
	AriaLabelProps &
	ElementPassthroughProps<'button'> & {
		tag?: 'button' | 'a' | 'div' | 'span'
		onClick?: (e: MouseEvent) => void
		children?: JSX.Children
	}
```

Important fields:

- `disabled`
- `onClick`
- `children`
- `icon`
- `iconPosition`
- `ariaLabel`
- `tag`
- `el`
- `variant`

## What `buttonModel()` returns

```ts
type ButtonModel = {
	readonly isIconOnly: boolean
	readonly hasLabel: boolean
	readonly tag: 'button' | 'a' | 'div' | 'span'
	readonly icon:
		| {
				readonly position: 'start' | 'end'
				readonly span: JSX.IntrinsicElements['span']
				readonly element?: JSX.Element
		  }
		| undefined
	readonly button: JSX.IntrinsicElements['button']
}
```

## Usage

```tsx
import { buttonModel } from '@pounce/ui'

function Button(props) {
	const model = buttonModel(props)
	return (
		<dynamic tag={model.tag} {...model.button} {...props.el}>
			{model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
			{props.children}
		</dynamic>
	)
}
```

## Behavior

- `model.button.onClick` is suppressed when `disabled` is true
- `model.button.disabled` mirrors `props.disabled`
- `model.button['aria-disabled']` mirrors `props.disabled`
- `model.tag` defaults to `'button'`
- `model.icon` is `undefined` when no icon is provided
- string icons are resolved through `<Icon name={props.icon} />`
- JSX icons are passed through unchanged

## Icon positioning

`iconPosition` is treated logically, not physically.

- `'start'` places the icon before the label
- `'end'` places the icon after the label
- legacy `'left'` and `'right'` are normalized internally

The model encodes icon placement in `model.icon.span.style` using:

- `order`
- `marginInlineStart`
- `marginInlineEnd`

## Accessibility

For icon-only buttons, the model supplies a fallback accessible name:

```ts
props.ariaLabel ?? props.el?.['aria-label'] ?? 'Action'
```

For labeled buttons, the fallback `'Action'` is not used.

import { Code, PackageHeader, Section } from '../../components'

const customAdapter = `import { uiComponent, gather } from '@pounce/ui'
import { type ButtonProps as BaseButtonProps, buttonModel } from '@pounce/ui/models'

const myComponent = uiComponent(['primary', 'secondary', 'danger'] as const)

type MyButtonProps = Omit<BaseButtonProps, 'variant'> & {
  variant?: 'primary' | 'secondary' | 'danger'
}

export const Button = myComponent(function Button(props: MyButtonProps) {
  const model = buttonModel(props)

  return (
    <button {...props.el} class={
      props.variant === 'danger' ? 'btn btn-danger' : 'btn'
    } {...model.button}>
      {model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
      {model.hasLabel && gather(props.children)}
    </button>
  )
})`

const packageShape = `src/
  factory.ts        // shared variant list + uiComponent(...)
  components/
    button.tsx      // thin wrappers around @pounce/ui models
    card.tsx
    dialog.tsx
  directives/
    tooltip.ts
  index.ts          // export * from './components'; export * from './directives'`

export default function CreatingAdapterPage() {
	return (
		<article>
			<PackageHeader
				name="Creating Adapters"
				description="How to build a custom adapter for any CSS framework."
			/>

			<Section title="Implementation Guide">
				<p>
					A custom adapter is just a package of visual components built on top of{' '}
					<code>@pounce/ui</code> models. Start with a shared <code>uiComponent(...)</code>
					factory for your variant set, then wrap each headless model with your DOM and classes.
				</p>
				<Code code={customAdapter} lang="tsx" />
			</Section>

			<Section title="Package Shape">
				<p>
					Keep adapters small and predictable: one shared factory, thin component wrappers, optional
					directives, and a flat barrel export.
				</p>
				<Code code={packageShape} lang="tsx" />
			</Section>

			<Section title="Component-Specific Customization">
				<p>
					The model owns behavior, accessibility, and binding semantics; the adapter owns element
					shape, framework classes, and any adapter-specific prop narrowing.
				</p>
			</Section>

			<Section title="Variants">
				<p>
					Variants are best modeled as a narrow string union at the adapter boundary. The shared
					<code>uiComponent(...)</code> wrapper gives you variant typing plus dot-syntax like{' '}
					<code>{'<Button.primary />'}</code>.
				</p>
			</Section>
		</article>
	)
}

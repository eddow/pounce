import { Code, PackageHeader, Section } from '../../components'

const adapterPattern = `// vite.config.ts
import { pounceBarrelPlugin, pounceMinimalPackage } from '@pounce/core/plugin'

export default defineConfig({
  plugins: [
    ...pounceMinimalPackage(),
    pounceBarrelPlugin({
      name: '@pounce',
      skeleton: 'front-end',
      adapter: '@pounce/adapter-pico',
    }),
  ],
})

// app.tsx
import { Button } from '@pounce'

<Button.primary>Save</Button.primary>`

const wrapperSnippet = `import { gather } from '@pounce/ui'
import { type ButtonProps as BaseButtonProps, buttonModel } from '@pounce/ui/models'
import { picoComponent, type PicoButtonLikeProps, picoButtonClass } from '../factory'

export type ButtonProps = PicoButtonLikeProps<BaseButtonProps>

export const Button = picoComponent(function Button(props: ButtonProps) {
  const model = buttonModel(props)

  return (
    <button {...props.el} class={picoButtonClass(props.variant ?? 'secondary', props.outline)} {...model.button}>
      {model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
      {model.hasLabel && gather(props.children)}
    </button>
  )
})`

export default function AdaptersIndexPage() {
	return (
		<article>
			<PackageHeader
				name="Adapters"
				description="The secret to framework-agnostic UI. Adapters decouple component logic from specific CSS frameworks."
			/>

			<Section title="The Pattern">
				<p>
					Pounce keeps behavior and visuals separate. <code>@pounce/ui</code> owns models,
					directives, and overlay logic; an adapter such as <code>@pounce/adapter-pico</code>
					wraps those models with concrete DOM shape and framework classes.
				</p>
				<p>
					The app itself normally imports through a generated <code>@pounce</code> barrel, so you
					can swap adapters without changing application imports.
				</p>
				<Code code={adapterPattern} lang="tsx" />
			</Section>

			<Section title="Wrapper Components">
				<p>
					Adapters are ordinary packages exporting components built on top of headless models. The
					common pattern is: narrow adapter-side props, call the model, then render DOM and classes.
				</p>
				<Code code={wrapperSnippet} lang="tsx" />
			</Section>

			<Section title="Consumption">
				<p>
					Consumers do not install or mutate a global adapter registry. They pick an adapter at
					build time, import from <code>@pounce</code> or the adapter package, and use the resulting
					components directly.
				</p>
			</Section>
		</article>
	)
}

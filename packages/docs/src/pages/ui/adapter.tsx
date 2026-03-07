import { Code, Section } from '../../components'

const adapterPattern = `// Adapters are configured in vite.config.ts via the @pounce barrel plugin.
// This decouples component logic from CSS framework styling.
// Components import Button, Card etc. from '@pounce' and get the adapted version.

// vite.config.ts
import { pounceBarrelPlugin, pounceMinimalPackage } from '@pounce/core/plugin'

export default defineConfig({
  plugins: [
    ...pounceMinimalPackage(),
    pounceBarrelPlugin({
      name: '@pounce',
      skeleton: 'front-end',
      adapter: '@pounce/adapter-pico', // The adapter is chosen here
    }),
  ],
})`

const adapterStructure = `import { gather } from '@pounce/ui'
import { type ButtonProps as BaseButtonProps, buttonModel } from '@pounce/ui/models'
import { type PicoButtonLikeProps, picoButtonClass, picoComponent } from '../factory'

type ButtonProps = PicoButtonLikeProps<BaseButtonProps>

export const Button = picoComponent(function Button(props: ButtonProps) {
  const model = buttonModel(props)

  return (
    <button
      {...props.el}
      class={picoButtonClass(props.variant ?? 'secondary', props.outline)}
      {...model.button}
    >
      {model.icon && <span {...model.icon.span}>{model.icon.element}</span>}
      {model.hasLabel && gather(props.children)}
    </button>
  )
})`

const picoDetails = `// @pounce/adapter-pico maps Pounce's CSS variables to PicoCSS:
//   --pounce-primary    → --pico-primary
//   --pounce-bg         → --pico-background-color
//   --pounce-fg         → --pico-color
//   --pounce-border     → --pico-border-color
//   etc.
//
// To use it, configure the barrel plugin:
// vite.config.ts
pounceBarrelPlugin({
  adapter: '@pounce/adapter-pico',
})

import '@picocss/pico/css/pico.min.css'
import '@pounce/adapter-pico/css'`

const uiOptions = `import { options } from '@pounce'

// Global UI options are deliberately tiny.
// The main extension point is icon rendering.

options.iconFactory = (name, size, el, context) => {
  return <span class={\`icon-\${name}\`} {...el} />
}`

export default function AdapterPage() {
	return (
		<article>
			<h1>Adapter Pattern</h1>
			<p>
				The adapter pattern decouples component logic from CSS framework styling. Swap PicoCSS for
				Tailwind, Bootstrap, or any custom framework without changing component code.
			</p>

			<Section title="How It Works">
				<Code code={adapterPattern} lang="tsx" />
			</Section>

			<Section title="Adapter Structure">
				<p>
					Adapters are thin visual wrappers around <code>@pounce/ui</code> models. A component calls
					its model, renders DOM, and applies framework-specific classes.
				</p>
				<Code code={adapterStructure} lang="tsx" />
			</Section>

			<Section title="PicoCSS Adapter">
				<p>
					<code>@pounce/adapter-pico</code> bridges Pounce's CSS variable contract to PicoCSS's
					theming system.
				</p>
				<Code code={picoDetails} lang="tsx" />
			</Section>

			<Section title="UI Options">
				<p>
					Configure shared icon rendering through the <code>options</code> object. Most styling and
					markup concerns belong in the adapter package itself, not in runtime configuration.
				</p>
				<Code code={uiOptions} lang="tsx" />
			</Section>
		</article>
	)
}

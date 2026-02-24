import { Code, Section } from '../../components'

const adapterPattern = `// Adapters are configured in vite.config.ts via the @pounce barrel plugin.
// This decouples component logic from CSS framework styling.
// Components import Button, Card etc. from '@pounce' and get the adapted version.

// vite.config.ts
pounceBarrelPlugin({
  name: '@pounce',
  skeleton: 'front-end',
  adapter: '@pounce/adapter-pico', // The adapter is chosen here
})`

const adapterStructure = `import type { FrameworkAdapter } from '@pounce'

// An adapter is a Partial<FrameworkAdapter> with:
const myAdapter: Partial<FrameworkAdapter> = {
  // Variants — JSX-spreadable attribute bags per variant name:
  variants: {
    primary: { class: 'btn-primary', 'data-variant': 'primary' },
    danger: { class: 'btn-danger', 'data-variant': 'danger' },
    success: { class: 'btn-success', 'data-variant': 'success' },
  },

  // Component-specific configs:
  components: {
    Button: { classes: { base: 'my-button' } },
    Card: { classes: { base: 'my-card' } },
    Dialog: { classes: { base: 'my-dialog', backdrop: 'my-backdrop' } },
  },

  // Transitions for overlays:
  transitions: {
    dialog: { enter: 'fade-in', leave: 'fade-out' },
    toast: { enter: 'slide-in', leave: 'slide-out' },
  },

  // Icon factory:
  iconFactory: (name: string) => <i class={\`icon-\${name}\`} />,
}`

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

const uiOptions = `import { options } from '@pounce/ui'

// Global UI options are configured by mutating the 'options' object.
// This is typical for app-wide settings like icon rendering.

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
				<p>An adapter provides variants, component configs, transitions, and an icon factory.</p>
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
					Configure global UI behavior like icon rendering via the <code>options</code> object.
				</p>
				<Code code={uiOptions} lang="tsx" />
			</Section>
		</article>
	)
}

import { Code, Section } from '../../components'

const adapterPattern = `// The adapter pattern decouples component logic from CSS framework styling.
// Components call getAdapter('Button') to get variant classes, configs, etc.
// Swap the adapter to change the entire look without touching component code.

import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'

// Install once at app startup:
setAdapter(picoAdapter)`

const adapterStructure = `import type { FrameworkAdapter } from '@pounce/ui'

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
// It also provides variant attribute bags that map to PicoCSS's
// data-attribute-based theming (e.g., [data-variant="primary"]).

import '@picocss/pico/css/pico.min.css'
import { picoAdapter } from '@pounce/adapter-pico'
setAdapter(picoAdapter)`

const customAdapter = `// To create a custom adapter:
// 1. Define variants (JSX-spreadable attribute bags)
// 2. Define component configs (base classes, sub-element classes)
// 3. Optionally define transitions and icon factory
// 4. Call setAdapter() with your adapter

import { setAdapter } from '@pounce/ui'

setAdapter({
  variants: {
    primary: { class: 'bg-blue-500 text-white', 'data-variant': 'primary' },
    danger: { class: 'bg-red-500 text-white', 'data-variant': 'danger' },
  },
  components: {
    Button: { classes: { base: 'px-4 py-2 rounded' } },
  },
})`

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

			<Section title="Custom Adapter">
				<p>Create your own adapter for any CSS framework.</p>
				<Code code={customAdapter} lang="tsx" />
			</Section>
		</article>
	)
}

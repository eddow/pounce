import { Code, PackageHeader, Section } from '../../components'

const adapterPattern = `import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'

// Mix and match adapters
setAdapter(
  picoAdapter,
  { 
    iconFactory: (name) => <i class={\`icon-\${name}\`} /> 
  }
)`

const registrySnippet = `import { getAdapter } from '@pounce/ui/adapter'

// Inside a component:
const adapter = getAdapter('Button')
return <button class={adapter.classes?.root}>...</button>`

export default function AdaptersIndexPage() {
	return (
		<article>
			<PackageHeader
				name="Adapters"
				description="The secret to framework-agnostic UI. Adapters decouple component logic from specific CSS frameworks."
			/>

			<Section title="The Pattern">
				<p>
					Pounce UI components don't contain hardcoded classes like <code>btn</code> or{' '}
					<code>card</code>. Instead, they request their styling and structure from a central{' '}
					<strong>Adapter Registry</strong>.
				</p>
				<p>
					This allows you to switch from a custom design to a framework like PicoCSS or Tailwind
					without changing a single line of application logic.
				</p>
				<Code code={adapterPattern} lang="tsx" />
			</Section>

			<Section title="Adapter Composition">
				<p>
					Adapters are composable. You can call <code>setAdapter()</code> multiple times; subsequent
					calls will merge into the existing configuration, allowing you to override specific
					components or global behaviors like icons.
				</p>
			</Section>

			<Section title="Consumption">
				<p>
					Component authors use <code>getAdapter(name)</code> to retrieve the current configuration
					for their component.
				</p>
				<Code code={registrySnippet} lang="tsx" />
			</Section>
		</article>
	)
}

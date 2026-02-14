import { Section, Code, PackageHeader } from '../../components'

const customAdapter = `import { FrameworkAdapter } from '@pounce/ui'

export const myAdapter: FrameworkAdapter = {
  // 1. Global Icon system
  iconFactory: (name, size) => <i class={\`my-icon-\${name}\`} />,

  // 2. Map semantic variants to your CSS
  variants: {
    primary: { classes: ['my-btn-primary'] },
    danger: { classes: ['my-bg-red', 'my-text-white'] }
  },

  // 3. Customize specific components
  components: {
    Button: {
      classes: { root: 'my-base-button' }
    }
  }
}`

export default function CreatingAdapterPage() {
	return (
		<article>
			<PackageHeader
				name="Creating Adapters"
				description="How to build a custom adapter for any CSS framework."
			/>

			<Section title="Implementation Guide">
				<p>
					Building a custom adapter involves satisfying the <code>FrameworkAdapter</code> interface.
					You can choose to implement as little or as much as you need.
				</p>
				<Code code={customAdapter} lang="tsx" />
			</Section>

			<Section title="Component-Specific Customization">
				<p>
					Each component in <code>@pounce/ui</code> exposes a specific adaptation type via the <code>UiComponents</code> registry.
					For example, <code>Button</code> accepts <code>IconAdaptation</code>, giving you control over icon placement and class names.
				</p>
			</Section>

			<Section title="Variant Traits">
				<p>
					The <code>variants</code> object uses the <strong>Trait</strong> system from Pounce Core.
					A trait can include multiple classes, data attributes, and even ARIA roles.
				</p>
			</Section>
		</article>
	)
}

import { Section, Code, PackageHeader } from '../../components'

const usage = `import { setAdapter, vanillaAdapter } from '@pounce/ui'

// Enable standard variants and transitions without an external framework
setAdapter(vanillaAdapter)`

export default function VanillaAdapterPage() {
	return (
		<article>
			<PackageHeader
				name="Vanilla Adapter"
				description="The default adapter for standalone Pounce UI usage."
			/>

			<Section title="When to use">
				<p>
					Use the Vanilla adapter if you are building a custom design from scratch or not using a CSS framework.
					It provides the "glue" for Pounce features like:
				</p>
				<ul>
					<li><strong>Variants</strong>: Connects <code>variant="primary"</code> to <code>.pounce-variant-primary</code> CSS classes.</li>
					<li><strong>Transitions</strong>: Provides default fade-in/out animations for overlays and lists.</li>
					<li><strong>A11y</strong>: Maps variant attributes to the correct ARIA attributes automatically.</li>
				</ul>
			</Section>

			<Section title="Installation">
				<p>The Vanilla adapter is exported directly from the <code>@pounce/ui</code> package.</p>
				<Code code={usage} lang="tsx" />
			</Section>
		</article>
	)
}

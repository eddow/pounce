import { Code, PackageHeader, Section } from '../../components'

const usage = `// vite.config.ts
sursautBarrelPlugin({
	adapter: '@sursaut/adapter-pico'
})`

export default function PicoAdapterPage() {
	return (
		<article>
			<PackageHeader
				name="@sursaut/adapter-pico"
				description="Adapter for the PicoCSS framework."
			/>

			<Section title="Features">
				<ul>
					<li>
						<strong>Variant Bridge</strong>: Maps Sursaut variants (primary, success, etc.) to
						PicoCSS colored buttons and inputs.
					</li>
					<li>
						<strong>CSS Variable Bridge</strong>: Automatically remaps <code>--sursaut-*</code>{' '}
						variables to <code>--pico-*</code>.
					</li>
					<li>
						<strong>Icon Factory</strong>: Supports Glyf icons out of the box.
					</li>
					<li>
						<strong>Directives</strong>: Includes a <code>use:tooltip</code> directive mapped to
						Pico's tooltip style.
					</li>
				</ul>
			</Section>

			<Section title="Installation">
				<Code code={usage} lang="tsx" />
			</Section>

			<Section title="Semantic Support">
				<p>
					Since PicoCSS doesn't have native "success" or "danger" button classes, the adapter
					provides them via the
					<code>@sursaut/adapter-pico/css</code> import, ensuring a consistent experience across all
					Sursaut UI components.
				</p>
			</Section>
		</article>
	)
}

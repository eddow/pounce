import { PackageHeader, Section } from '../../components'

export default function PureGlyfIndexPage() {
	return (
		<article>
			<PackageHeader
				name="Pure-glyf"
				description="Optimized SVG-to-CSS icon system with automatic injection and tree-shaking support."
				install="pnpm add pure-glyf"
			/>

			<Section title="What is Pure-glyf?">
				<p>
					Pure-glyf is a lightweight icon system designed for maximum performance and minimal bundle
					size. Instead of shipping heavy SVG components or massive icon fonts, it transforms SVGs
					into highly optimized <code>mask-image</code> CSS rules.
				</p>
				<ul>
					<li>
						🚀 <strong>Zero Runtime Overhead</strong>: Icons are injected as plain CSS via IIFEs.
					</li>
					<li>
						🌲 <strong>Tree-Shakable</strong>: Only the icons you actually import are included in
						your bundle.
					</li>
					<li>
						🎨 <strong>CSS Powered</strong>: Style icons using standard CSS properties like{' '}
						<code>color</code> and <code>font-size</code>.
					</li>
					<li>
						📦 <strong>Pounce Integration</strong>: Seamlessly integrates with{' '}
						<code>@pounce/ui</code> adapters.
					</li>
				</ul>
			</Section>

			<Section title="How it Works">
				<p>
					During your build process, SVGs are converted into Base64-encoded Data URIs. When an icon
					is imported, it automatically injects its own CSS rule into a global stylesheet managed by
					Pure-glyf.
				</p>
			</Section>
		</article>
	)
}

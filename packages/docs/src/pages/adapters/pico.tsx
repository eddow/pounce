import { Section, Code, PackageHeader } from '../../components'

const usage = `import { setAdapter } from '@pounce/ui'
import { picoAdapter } from '@pounce/adapter-pico'
import '@pounce/adapter-pico/css'       // Bridge variables
import '@picocss/pico/css/pico.min.css' // PicoCSS

setAdapter(picoAdapter)`

export default function PicoAdapterPage() {
	return (
		<article>
			<PackageHeader
				name="@pounce/adapter-pico"
				description="Adapter for the PicoCSS framework."
			/>

			<Section title="Features">
				<ul>
					<li><strong>Variant Bridge</strong>: Maps Pounce variants (primary, success, etc.) to PicoCSS colored buttons and inputs.</li>
					<li><strong>CSS Variable Bridge</strong>: Automatically remaps <code>--pounce-*</code> variables to <code>--pico-*</code>.</li>
					<li><strong>Icon Factory</strong>: Supports Glyf icons out of the box.</li>
					<li><strong>Directives</strong>: Includes a <code>use:tooltip</code> directive mapped to Pico's tooltip style.</li>
				</ul>
			</Section>

			<Section title="Installation">
				<Code code={usage} lang="tsx" />
			</Section>

			<Section title="Semantic Support">
				<p>
					Since PicoCSS doesn't have native "success" or "danger" button classes, the adapter provides them via the
					<code>@pounce/adapter-pico/css</code> import, ensuring a consistent experience across all Pounce UI components.
				</p>
			</Section>
		</article>
	)
}

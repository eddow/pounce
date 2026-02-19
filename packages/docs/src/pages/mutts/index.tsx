import { PackageHeader, Section } from '../../components'

export default function MuttsIndexPage() {
	return (
		<article>
			<PackageHeader
				name="Mutts"
				description="The foundational reactivity engine for Pounce. Proxy-based signals, smart collections, and async context management."
				install="pnpm add mutts"
			/>

			<Section title="Philosophy: Affirmative vs. Legacy Events">
				<p>
					Mutts promotes an <strong>Affirmative (Indicative)</strong> programming model over
					traditional imperative or event-driven patterns.
				</p>
				<ul>
					<li>
						<strong>State is Truth</strong>: Your data model is the single source of truth.
					</li>
					<li>
						<strong>Derivation</strong>: UI components and computed properties automatically align
						with that truth.
					</li>
					<li>
						<strong>Declarative</strong>: You declare <code>Y = f(X)</code>. The system ensures{' '}
						<code>Y</code> is always consistent with <code>X</code>.
					</li>
				</ul>
				<blockquote>
					[!TIP] Internal application logic should be expressible via reactive derivations rather
					than transient event pulses. Events are for legacy APIs and external standards (like DOM
					clicks).
				</blockquote>
			</Section>

			<Section title="Environment Support">
				<p>
					Mutts is environment-aware and provides optimized entry points for both Node.js and the
					Browser. It uses <code>AsyncLocalStorage</code> in Node and a lightweight wrapper in the
					browser to maintain context across async boundaries.
				</p>
			</Section>

			<Section title="Core Modules">
				<ul>
					<li>
						💎 <strong>Signals</strong>: <code>reactive</code>, <code>effect</code>, and{' '}
						<code>memoize</code>.
					</li>
					<li>
						🏗️ <strong>Collections</strong>: Fine-grained transformations with <code>project</code>{' '}
						and <code>scan</code>.
					</li>
					<li>
						🌌 <strong>Zones</strong>: Context propagation across asynchronous execution.
					</li>
					<li>
						🛠️ <strong>Decorators</strong>: Unified Stage 3 and Legacy decorator support.
					</li>
				</ul>
			</Section>
		</article>
	)
}

import { Section, Code, PackageHeader, ApiTable } from '../../components'

const zoneSnippet = `import { Zone, asyncZone } from 'mutts'

const authZone = new Zone<{ user: string }>()

// Register with asyncZone so context survives across await
asyncZone.add(authZone)

// Enter a context
authZone.with({ user: 'Alice' }, async () => {
  console.log(authZone.active?.user) // 'Alice'
  
  await delay(100)
  
  // Context is automatically preserved across async boundaries!
  console.log(authZone.active?.user) // 'Alice'
})`

export default function MuttsZonesPage() {
	return (
		<article>
			<PackageHeader
				name="Mutts Zones"
				description="Robust asynchronous context propagation and execution history."
			/>

			<Section title="Context Propagation">
				<p>
					Zones solve the problem of passing data through complex asynchronous call stacks without "prop drilling".
					By leveraging environment-specific hooks (like <code>AsyncLocalStorage</code> in Node),
					Mutts ensures that your context "follows" the execution across Promises, timers, and I/O.
				</p>
				<Code code={zoneSnippet} lang="tsx" />
			</Section>

			<Section title="History & Aggregation">
				<ul>
					<li><strong><code>ZoneHistory</code></strong>: Tracks the history of context entries, allowing you to see where a value was originally set.</li>
					<li><strong><code>ZoneAggregator</code></strong>: Merges context values from multiple levels of the hierarchy into a single view.</li>
				</ul>
			</Section>

			<Section title="API Reference">
				<ApiTable
					props={[
						{ name: 'new Zone<T>()', type: 'Zone<T>', description: 'Creates a new typed execution zone.' },
						{ name: 'zone.with(value, fn)', type: 'R', description: 'Runs a function within the specified context. Restores previous context on exit.' },
						{ name: 'zone.active', type: 'T | undefined', description: 'The current active context value for the zone.' },
						{ name: 'asyncZone', type: 'ZoneAggregator', description: 'Global aggregator. Register zones via asyncZone.add(zone) to preserve them across async boundaries.' },
					]}
				/>
			</Section>
		</article>
	)
}

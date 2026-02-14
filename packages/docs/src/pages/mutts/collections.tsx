import { Section, Code, PackageHeader } from '../../components'

const projectSnippet = `import { project } from 'mutts'

const source = reactive([1, 2, 3])

// Each item gets a "dedicated worker" (effect)
const doubled = project(source, ({ value }) => {
  console.log(\`Processing \${value}\`)
  return value * 2
})

source.push(4) // Only "Processing 4" is logged
source[0] = 10 // Only "Processing 10" is logged`

export default function MuttsCollectionsPage() {
	return (
		<article>
			<PackageHeader
				name="Mutts Collections"
				description="Surgical collection transforms using the 'Dedicated Worker' pattern."
			/>

			<Section title="Project vs Map">
				<p>
					Traditional <code>Array.map</code> is like an assembly line: if one item changes, you re-run the entire line.
					<code>project()</code> is different—it assigns a <strong>Dedicated Worker</strong> (a fine-grained effect) to each item.
				</p>
				<ul>
					<li><strong>Live Connection</strong>: Creates a permanent, reactive mirror of the source collection.</li>
					<li><strong>Surgical Precision</strong>: If item #5 changes, <em>only</em> item #5 is re-calculated.</li>
					<li><strong>Efficiency</strong>: Move and delete operations are O(1) for the transform logic.</li>
				</ul>
				<Code code={projectSnippet} lang="tsx" />
			</Section>

			<Section title="Scanning & Attendance">
				<ul>
					<li><strong><code>scan(array, cb, initial)</code></strong>: Reactive accumulation (like reduce) optimized for collection moves.</li>
					<li><strong><code>attend(collection, cb)</code></strong>: Subscribe to additions, removals, and updates with per-item cleanup support.</li>
					<li><strong><code>lift(fn)</code></strong>: Wraps a computed expression in an effect and returns a reactive mirror that stays in sync.</li>
				</ul>
			</Section>
		</article>
	)
}

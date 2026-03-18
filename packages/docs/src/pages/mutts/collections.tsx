import { Code, PackageHeader, Section } from '../../components'

const morphSnippet = `import { morph } from 'mutts'

const source = reactive([1, 2, 3])

// Each item gets a "dedicated worker" (effect)
// Arrays now receive (item, position) for index tracking
const doubled = morph(source, (item, position) => {
  console.log(\`Processing \${item} at index \${position.index}\`)
  return item * 2
})

source.push(4) // Only "Processing 4 at index 3" is logged
source[0] = 10 // Only "Processing 10 at index 0" is logged

// Position.index updates reactively during reorders
source.unshift(0) // position.index for all items shifts automatically`

export default function MuttsCollectionsPage() {
	return (
		<article>
			<PackageHeader
				name="Mutts Collections"
				description="Surgical collection transforms using the 'Dedicated Worker' pattern."
			/>

			<Section title="Morph vs Map">
				<p>
					Traditional <code>Array.map</code> is like an assembly line: if one item changes, you
					re-run the entire line.
					<code>morph()</code> is different—it assigns a <strong>Dedicated Worker</strong> (a
					fine-grained effect) to each item.
				</p>
				<ul>
					<li>
						<strong>Live Connection</strong>: Creates a permanent, reactive mirror of the source
						collection.
					</li>
					<li>
						<strong>Surgical Precision</strong>: If item #5 changes, <em>only</em> item #5 is
						re-calculated.
					</li>
					<li>
						<strong>Efficiency</strong>: Move and delete operations are O(1) for the transform
						logic.
					</li>
				</ul>
				<Code code={morphSnippet} lang="tsx" />
			</Section>

			<Section title="Scanning & Attendance">
				<ul>
					<li>
						<strong>
							<code>attend(collection, cb)</code>
						</strong>
						: Subscribe to additions, removals, and updates with per-item cleanup support.
					</li>
					<li>
						<strong>
							<code>lift(fn)</code>
						</strong>
						: Wraps a computed expression in an effect and returns a reactive mirror that stays in
						sync.
					</li>
				</ul>
			</Section>
		</article>
	)
}

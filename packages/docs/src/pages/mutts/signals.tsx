import { ApiTable, Code, PackageHeader, Section } from '../../components'

const signalsSnippet = `import { reactive, effect, memoize } from 'mutts'

const state = reactive({ count: 0 })
const double = memoize(() => state.count * 2)

effect(() => {
  console.log(\`Count is \${state.count}, double is \${double()}\`)
})

state.count++ // Triggers effect`

const cleanupSnippet = `effect(({ reaction }) => {
  const timer = setInterval(() => { ... }, 1000)

  // Cleanup with Reason
  return (reason) => {
    clearInterval(timer)
    if (reason?.type === 'propChange') {
      console.log('Triggered by:', reason.triggers[0].evolution.prop)
    }
  }
})`

export default function MuttsSignalsPage() {
	return (
		<article>
			<PackageHeader
				name="Mutts Signals"
				description="Proxy-based reactivity with automatic dependency tracking and deep-touch optimizations."
			/>

			<Section title="Core API">
				<p>
					Mutts uses native JavaScript Proxies to track property access. Dependencies are collected
					automatically when an <code>effect</code> or <code>memoize</code> runs.
				</p>
				<Code code={signalsSnippet} lang="tsx" />
			</Section>

			<Section title="Cleanup & Reaction Reasons">
				<p>
					Effects and their cleanup functions receive a <strong>CleanupReason</strong> object,
					explaining exactly <em>why</em> the effect is re-running or being disposed.
				</p>
				<Code code={cleanupSnippet} lang="tsx" />
				<ul>
					<li>
						<code>propChange</code>: Triggered by one or more reactive property mutations.
					</li>
					<li>
						<code>stopped</code>: Manually stopped or parent effect disposed.
					</li>
					<li>
						<code>lineage</code>: Child effect stopped because its parent stopped.
					</li>
					<li>
						<code>gc</code>: Garbage collected by the system.
					</li>
					<li>
						<code>error</code>: Stopped due to an unhandled error in the effect chain.
					</li>
				</ul>
			</Section>

			<Section title="API Reference">
				<ApiTable
					props={[
						{
							name: 'reactive(obj)',
							type: 'T',
							description: 'Returns a reactive proxy of the object. Supports deep nesting.',
						},
						{
							name: 'effect(fn, options?)',
							type: 'Effect',
							description: 'Runs the function and re-runs it when dependencies change.',
						},
						{
							name: 'memoize(fn, options?)',
							type: '() => T',
							description: 'Creates a cached, computed value that updates reactively.',
						},
						{
							name: 'untracked(fn)',
							type: 'T',
							description: 'Runs a function without collecting dependencies.',
						},
						{
							name: 'cleanedBy(owner, fn)',
							type: 'T & { [cleanup] }',
							description:
								"Ties a cleanup function to the owner's lifecycle. Returns the owner with a cleanup symbol.",
						},
					]}
				/>
			</Section>
		</article>
	)
}

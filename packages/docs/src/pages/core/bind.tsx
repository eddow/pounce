import { Code, Section } from '../../components'

const basicExample = `import { reactive } from 'mutts'

const form = reactive({ name: 'Alice' })
const mirror = reactive({ name: '' })

// Changes to form.name propagate to mirror.name and vice-versa
bind: mirror.name = form.name`

const defaultExample = `const settings = reactive<{ theme: string | undefined }>({ theme: undefined })
const local = reactive({ theme: '' })

// Sets settings.theme = 'light' if null/undefined, then syncs both ways
bind: local.theme = settings.theme ??= 'light'`

const componentExample = `function ThemeSync(_props: {}, env: { globalTheme: { value: string } }) {
  const local = reactive({ value: 'light' })

  // Bidirectionally sync local.value with the env-provided global theme
  bind: local.value = env.globalTheme.value

  return (
    <select value={local.value}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  )
}`

const transformExample = `// What you write:
bind: b.x = a.x

// What the Babel plugin emits:
bind(r(() => b.x, _v => b.x = _v), r(() => a.x, _v => a.x = _v))

// With default:
bind: b.x = a.x ??= 7
// becomes:
bind(r(() => b.x, _v => b.x = _v), r(() => a.x, _v => a.x = _v), 7)`

const manualExample = `import { bind, ReactiveProp } from '@pounce/core'

// Call bind() directly to capture the cleanup handle
const stop = bind(
  new ReactiveProp(() => a.x, v => { a.x = v }),
  new ReactiveProp(() => b.x, v => { b.x = v })
)

// Tear down both effects when no longer needed
stop()`

export default function BindPage() {
	return (
		<article>
			<h1>
				<code>bind:</code> — Bidirectional Binding
			</h1>
			<p>
				The <code>bind:</code> labeled statement symmetrically synchronizes two reactive state
				slices. Unlike JSX attributes — which bind a prop to state — <code>bind:</code> lives in the{' '}
				<strong>component body</strong> (or any <code>.ts</code> file) and is not part of the
				element tree.
			</p>

			<Section title="Syntax">
				<p>
					<code>{'bind: dst = src'}</code> or <code>{'bind: dst = src ??= defaultValue'}</code>
				</p>
				<p>
					Both operands must be <strong>assignable</strong>: a member expression (
					<code>obj.prop</code>, <code>arr[i]</code>) or a mutable <code>let</code>/<code>var</code>{' '}
					identifier. The Babel plugin throws a build-time error for literals or <code>const</code>{' '}
					identifiers.
				</p>
				<p>
					The optional <code>{'??= defaultValue'}</code> sets <code>src</code> to{' '}
					<code>defaultValue</code> if <code>src</code> is <code>null</code> or{' '}
					<code>undefined</code> at mount time, <em>before</em> the sync effects run.
				</p>
			</Section>

			<Section title="Basic Usage">
				<Code code={basicExample} lang="ts" />
			</Section>

			<Section title="With Default Value">
				<Code code={defaultExample} lang="ts" />
			</Section>

			<Section title="In a Component">
				<Code code={componentExample} lang="tsx" />
			</Section>

			<Section title="How It Works">
				<p>
					The Babel plugin transforms <code>bind:</code> labeled statements into <code>bind()</code>{' '}
					calls with two-way <code>r()</code> reactive props. The <code>bind</code> and{' '}
					<code>r</code> identifiers are <strong>auto-imported</strong> from{' '}
					<code>@pounce/core</code> — do not import them manually in files using the label syntax.
				</p>
				<Code code={transformExample} lang="ts" />
				<p>
					The runtime <code>bind(dst, src, defaultValue?)</code> function:
				</p>
				<ul>
					<li>
						Applies <code>defaultValue</code> imperatively before effects run (if{' '}
						<code>src.get() == null</code>)
					</li>
					<li>
						Creates two reactive effects — one syncing <code>src → dst</code>, one syncing{' '}
						<code>dst → src</code>
					</li>
					<li>Uses a shared sentinel to suppress infinite update loops</li>
					<li>
						Returns a cleanup <code>{'() => void'}</code> that stops both effects
					</li>
				</ul>
			</Section>

			<Section title="Capturing the Cleanup">
				<p>
					When used as a bare statement, the cleanup is discarded and tied to the enclosing
					component's lifecycle. To stop the binding manually, call <code>bind()</code> directly
					with explicit <code>ReactiveProp</code> instances:
				</p>
				<Code code={manualExample} lang="ts" />
			</Section>

			<Section title="Rules & Gotchas">
				<ul>
					<li>
						<strong>Assignable operands only</strong> — the plugin throws at build time for
						non-assignable expressions.
					</li>
					<li>
						<strong>No manual imports</strong> — <code>bind</code> and <code>r</code> are
						auto-injected. Importing them manually in the same file is harmless but redundant.
					</li>
					<li>
						<strong>Biome</strong>: <code>noUnusedLabels</code> is disabled in{' '}
						<code>biome.json</code>. Do not re-enable it — it would silently strip{' '}
						<code>bind:</code> statements.
					</li>
					<li>
						<strong>
							Works in <code>.ts</code> and <code>.tsx</code>
						</strong>{' '}
						— the Babel plugin processes all TypeScript files, not just JSX.
					</li>
				</ul>
			</Section>
		</article>
	)
}

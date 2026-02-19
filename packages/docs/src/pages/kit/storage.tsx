import { ApiTable, Code, Section } from '../../components'

const storedBasics = `import { stored } from '@pounce/kit'

// stored() creates a reactive object backed by localStorage.
// Changes persist across page reloads and sync across tabs.

const prefs = stored({
  theme: 'light',
  fontSize: 16,
  sidebarOpen: true,
})

// Read reactively in JSX:
<span>{prefs.theme}</span>

// Write — automatically saved to localStorage:
prefs.theme = 'dark'
prefs.fontSize = 18`

const interTab = `// stored() listens to the 'storage' event.
// When another tab changes the same key, this tab
// updates reactively — no polling needed.

const session = stored({ user: null, token: '' })

// Tab A:
session.user = { name: 'Alice' }

// Tab B sees the change instantly via storage event.`

const jsonCustom = `import { json } from '@pounce/kit'

// The json object controls serialization.
// Override parse/stringify for custom types:

const originalParse = json.parse
json.parse = <T>(value: string): T => {
  // Custom deserialization logic
  return originalParse(value)
}`

const cleanup = `import { stored } from '@pounce/kit'
import { cleanup } from 'mutts'

// stored() registers effects for each key.
// It returns a cleanable object — call cleanup() to
// remove localStorage listeners and stop effects.

const prefs = stored({ theme: 'light' })

// Later, to clean up:
cleanup(prefs)`

export default function StoragePage() {
	return (
		<article>
			<h1>Storage</h1>
			<p>
				<code>stored()</code> creates a reactive object backed by <code>localStorage</code>. Changes
				persist across reloads and sync across browser tabs.
			</p>

			<Section title="Basic Usage">
				<Code code={storedBasics} lang="tsx" />
			</Section>

			<Section title="Cross-Tab Sync">
				<p>
					<code>stored()</code> listens to the <code>storage</code> event. Changes in one tab
					propagate to all other tabs reactively.
				</p>
				<Code code={interTab} lang="tsx" />
			</Section>

			<Section title="Custom Serialization">
				<p>
					Override <code>json.parse</code> and <code>json.stringify</code> for custom types.
				</p>
				<Code code={jsonCustom} lang="tsx" />
			</Section>

			<Section title="Cleanup">
				<Code code={cleanup} lang="tsx" />
			</Section>

			<Section title="API Reference">
				<ApiTable
					props={[
						{
							name: 'stored(initial)',
							type: '(T) => T',
							description: 'Create reactive localStorage-backed object',
							required: true,
						},
						{
							name: 'json.parse',
							type: '(string) => T',
							description: 'Deserializer for stored values',
							required: false,
						},
						{
							name: 'json.stringify',
							type: '(T) => string',
							description: 'Serializer for stored values',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}

import { ApiTable, Code, Section } from '../../components'

const clientBasics = `import { client } from '@pounce/kit'

// client is a reactive object — read any property in JSX
// and it updates automatically when the browser state changes.

function StatusBar() {
  return (
    <footer>
      <span>{client.online ? 'Online' : 'Offline'}</span>
      <span>{client.language}</span>
      <span>{client.prefersDark ? 'Dark' : 'Light'}</span>
      <span>{client.viewport.width}x{client.viewport.height}</span>
    </footer>
  )
}`

const urlAccess = `// client.url is a reactive parsed URL object
client.url.pathname   // "/users/42"
client.url.search     // "?q=pounce"
client.url.hash       // "#section"
client.url.segments   // ["users", "42"]
client.url.query      // { q: "pounce" }
client.url.href       // full URL string
client.url.origin     // "http://localhost:5290"`

const navigation = `import { client } from '@pounce/kit'

// Programmatic navigation:
client.navigate('/about')                    // pushState
client.navigate('/about', { replace: true }) // replaceState
client.replace('/about')                     // shorthand for replace
client.reload()                              // full page reload`

const mediaQueries = `// These properties react to media queries and browser events:
client.prefersDark      // prefers-color-scheme: dark
client.online           // navigator.onLine (updates on online/offline events)
client.focused          // document.hasFocus()
client.visibilityState  // "visible" | "hidden"
client.devicePixelRatio // window.devicePixelRatio
client.direction        // "ltr" | "rtl" (from <html dir>)
client.timezone         // Intl.DateTimeFormat().resolvedOptions().timeZone`

export default function ClientPage() {
	return (
		<article>
			<h1>Client State</h1>
			<p>
				<code>client</code> is a reactive object that exposes browser state. All properties are
				tracked by mutts — read them in JSX and they update automatically.
			</p>

			<Section title="Basic Usage">
				<Code code={clientBasics} lang="tsx" />
			</Section>

			<Section title="URL">
				<p>
					<code>client.url</code> is a reactive parsed URL with pathname, search, hash, segments,
					and query.
				</p>
				<Code code={urlAccess} lang="tsx" />
			</Section>

			<Section title="Navigation">
				<Code code={navigation} lang="tsx" />
			</Section>

			<Section title="Media & Browser State">
				<Code code={mediaQueries} lang="tsx" />
			</Section>

			<Section title="API Reference">
				<ApiTable
					props={[
						{
							name: 'url',
							type: 'ClientUrl',
							description: 'Reactive parsed URL (pathname, search, hash, segments, query)',
							required: false,
						},
						{
							name: 'viewport',
							type: '{ width, height }',
							description: 'Window inner dimensions',
							required: false,
						},
						{ name: 'online', type: 'boolean', description: 'navigator.onLine', required: false },
						{
							name: 'prefersDark',
							type: 'boolean',
							description: 'prefers-color-scheme: dark',
							required: false,
						},
						{
							name: 'focused',
							type: 'boolean',
							description: 'document.hasFocus()',
							required: false,
						},
						{
							name: 'language',
							type: 'string',
							description: 'navigator.language',
							required: false,
						},
						{
							name: 'direction',
							type: "'ltr' | 'rtl'",
							description: 'Text direction from <html dir>',
							required: false,
						},
						{
							name: 'navigate(url)',
							type: '(string, opts?) => void',
							description: 'pushState navigation',
							required: false,
						},
						{
							name: 'replace(url)',
							type: '(string, opts?) => void',
							description: 'replaceState navigation',
							required: false,
						},
					]}
				/>
			</Section>
		</article>
	)
}

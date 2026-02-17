import { Section, Code, PackageHeader, ApiTable } from '../../components'

const factorySnippet = `// Browser — auto-configured with fetch
import { api } from '@pounce/kit'

// Simple GET with path params
const user = await api('/users/:id', { id: '123' }).get()

// POST with body
const created = await api('/users').post({ name: 'Alice' })`

const interceptorSnippet = `import { intercept } from '@pounce/kit'

// Global interceptor for all /api/** requests
intercept('/api/**', async (req, next) => {
  // Add auth header
  const authReq = new Request(req, {
    headers: { ...req.headers, Authorization: 'Bearer ...' }
  })
  
  const res = await next(authReq)
  
  // Log status
  console.log(\`\${req.method} \${req.url} -> \${res.status}\`)
  return res
})`

const ssrSnippet = `// Server-side (Node.js) — uses smart executor
import { api } from '@pounce/kit/node'
import { withSSR } from '@pounce/kit/node'

// SSR: API calls are tracked for hydration
const { result, context } = await withSSR(async () => {
  return renderApp()
})`

export default function KitApiPage() {
	return (
		<article>
			<PackageHeader
				name="@pounce/kit"
				description="Lightweight, type-safe API client with SSR hydration and interceptor support."
				install="pnpm add @pounce/kit"
			/>

			<Section title="API Client">
				<p>
					The API client is built on top of the native <code>Request</code> and <code>Response</code> APIs.
					It supports path parameter inference, automatic JSON serialization, and retries.
				</p>
				<Code code={factorySnippet} lang="tsx" />
			</Section>

			<Section title="Interceptors">
				<p>
					Interceptors allow you to transform requests and responses globaly or within a specific request context.
					They follow a middleware pattern.
				</p>
				<Code code={interceptorSnippet} lang="tsx" />
			</Section>

			<Section title="SSR Hydration">
				<p>
					When SSR is enabled, the client automatically tracks all <code>GET</code> requests.
					The data is collected and can be injected into the client-side page, allowing the client-side
					API client to "hydrate" the data instantly without a second network request.
				</p>
				<Code code={ssrSnippet} lang="tsx" />
			</Section>

			<Section title="API Reference">
				<ApiTable
					props={[
						{ name: 'api(path, params?)', type: 'function', description: 'Creates a request builder. Call .get(), .post(body), .put(body), .delete() on the result.' },
						{ name: 'intercept(pattern, handler)', type: 'function', description: 'Registers a global interceptor matching a URL pattern or regex. Returns an unsubscribe function.' },
						{ name: 'PounceResponse', type: 'class', description: 'Extended Response with .json<T>() typing and .hydrated for SSR data.' },
						{ name: 'ApiError', type: 'class', description: 'Error subclass thrown on non-2xx responses. Contains status, statusText, and response data.' },
					]}
				/>
			</Section>
		</article>
	)
}

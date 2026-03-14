import { test, expect } from '@playwright/test'

/**
 * API tests for the unified demo app.
 * Exercises expose() verbs, middleware, provide(), route groups, and SSE.
 */
test.describe('Demo API', () => {
	// ── Root ──────────────────────────────────────────────────────────
	test('GET / returns provide data (root)', async ({ request }) => {
		const res = await request.get('/', {
			headers: { 'X-Sursaut-Provide': 'true' },
		})
		expect(res.ok()).toBeTruthy()
		const data = await res.json()
		expect(data.siteName).toBe('Sursaut Demo')
		expect(data.buildTime).toBeDefined()
	})

	// ── Posts CRUD ────────────────────────────────────────────────────
	test('Posts CRUD flow', async ({ request }) => {
		// 1. List
		const listRes = await request.get('/posts')
		expect(listRes.ok()).toBeTruthy()
		const posts = await listRes.json()
		expect(posts.length).toBeGreaterThanOrEqual(2)

		// 2. Create
		const createRes = await request.post('/posts', {
			data: { title: 'E2E Post', content: 'Created by test' },
		})
		expect(createRes.ok()).toBeTruthy()
		const created = await createRes.json()
		expect(created.title).toBe('E2E Post')
		const newId = created.id

		// 3. Read
		const getRes = await request.get(`/posts/${newId}`)
		expect(getRes.ok()).toBeTruthy()
		const fetched = await getRes.json()
		expect(fetched.content).toBe('Created by test')

		// 4. Update
		const putRes = await request.put(`/posts/${newId}`, {
			data: { title: 'E2E Post Updated' },
		})
		expect(putRes.ok()).toBeTruthy()
		const updated = await putRes.json()
		expect(updated.title).toBe('E2E Post Updated')

		// 5. Delete
		const delRes = await request.delete(`/posts/${newId}`)
		expect(delRes.ok()).toBeTruthy()

		// 6. Verify gone
		const checkRes = await request.get(`/posts/${newId}`)
		expect(checkRes.status()).toBe(404)
	})

	// ── Posts middleware ──────────────────────────────────────────────
	test('Posts middleware sets X-Response-Time header', async ({ request }) => {
		const res = await request.get('/posts')
		expect(res.headers()['x-response-time']).toMatch(/^\d+ms$/)
	})

	// ── Users auth guard ─────────────────────────────────────────────
	test('Users GET requires Authorization header', async ({ request }) => {
		const noAuth = await request.get('/users')
		expect(noAuth.status()).toBe(401)

		const withAuth = await request.get('/users', {
			headers: { Authorization: 'Bearer test' },
		})
		expect(withAuth.ok()).toBeTruthy()
		const users = await withAuth.json()
		expect(users).toEqual([
			{ id: '1', name: 'Alice', role: 'admin' },
			{ id: '2', name: 'Bob', role: 'user' },
		])
	})

	// ── User detail ──────────────────────────────────────────────────
	test('GET /users/:id returns user with context', async ({ request }) => {
		const res = await request.get('/users/1', {
			headers: { Authorization: 'Bearer test' },
		})
		expect(res.ok()).toBeTruthy()
		const data = await res.json()
		expect(data.name).toBe('Alice')
		expect(data.contextUser).toEqual({ id: 'admin', role: 'root' })
	})

	// ── Route groups: (auth)/login ───────────────────────────────────
	test('POST /login authenticates', async ({ request }) => {
		const ok = await request.post('/login', {
			data: { username: 'admin', password: 'secret' },
		})
		expect(ok.ok()).toBeTruthy()
		const token = await ok.json()
		expect(token.token).toBe('fake-jwt')

		const fail = await request.post('/login', {
			data: { username: 'wrong', password: 'bad' },
		})
		expect(fail.status()).toBe(401)
	})

	// ── SSE stream ───────────────────────────────────────────────────
	test('GET /posts/:id/comments streams SSE events', async ({ request }) => {
		const res = await request.get('/posts/1/comments')
		// Stream endpoint should respond successfully
		expect(res.ok()).toBeTruthy()
		const text = await res.text()
		// Verify at least one SSE data line
		expect(text).toContain('data:')
		expect(text).toContain('Comment')
	})
})

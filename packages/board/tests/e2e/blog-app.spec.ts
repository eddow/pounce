
import { test, expect } from '@playwright/test'

test.describe('Blog App Consumer', () => {
	test.use({ baseURL: 'http://localhost:3001' })

	test.describe('API', () => {
		test('GET / should return API info', async ({ request }) => {
			const res = await request.get('/')
			expect(res.ok()).toBeTruthy()
			const data = await res.json()
			expect(data.name).toBe('Pounce Blog API')
		})

		test('Posts API CRUD flow', async ({ request }) => {
			// 1. List posts (initial)
			const listRes = await request.get('/posts')
			expect(listRes.ok()).toBeTruthy()
			const initialPosts = await listRes.json()
			expect(initialPosts.length).toBeGreaterThan(0)

			// 2. Create post
			const newPost = { title: 'E2E Testing', content: 'Is fun' }
			const createRes = await request.post('/posts', { data: newPost })
			expect(createRes.status()).toBe(201)
			const createdPost = await createRes.json()
			expect(createdPost.title).toBe(newPost.title)
			const newId = createdPost.id

			// 3. Get created post
			const getRes = await request.get(`/posts/${newId}`)
			expect(getRes.ok()).toBeTruthy()
			const fetchedPost = await getRes.json()
			expect(fetchedPost.content).toBe(newPost.content)

			// 4. Update post
			const updateRes = await request.put(`/posts/${newId}`, {
				data: { title: 'E2E Testing Updated' },
			})
			expect(updateRes.ok()).toBeTruthy()
			const updatedPost = await updateRes.json()
			expect(updatedPost.title).toBe('E2E Testing Updated')

			// 5. Delete post
			const deleteRes = await request.delete(`/posts/${newId}`)
			expect(deleteRes.ok()).toBeTruthy()

			// 6. Verify deletion
			const checkRes = await request.get(`/posts/${newId}`)
			expect(checkRes.status()).toBe(404)
		})

		test('Middleware adds headers', async ({ request }) => {
			const res = await request.get('/')
			expect(res.headers()['x-response-time']).toMatch(/^\d+ms$/)
			
			const postsRes = await request.get('/posts')
			expect(postsRes.headers()['x-resource']).toBe('Posts')
		})
	})

	test.describe('UI', () => {
		test('Home page lists posts', async ({ page }) => {
			await page.goto('/')
			await expect(page.locator('h1')).toHaveText('Latest Posts')
			
			const posts = page.locator('.post-card')
			await expect(posts).toHaveCount(2)
			await expect(posts.first()).toContainText('First Post')
		})

		test('Post detail page shows content and comments', async ({ page }) => {
			// Find a link to the first post and click it
			await page.goto('/')
			await page.locator('.post-card a').first().click()
			
			// Should navigate to /posts/1
			await expect(page).toHaveURL(/\/posts\/\d+/)
			
			// Check post content
			await expect(page.locator('article h1')).toBeVisible()
			await expect(page.locator('article .content')).toBeVisible()

			// Check comments (from proxy)
			const comments = page.locator('.comments-section li')
			await expect(comments).toHaveCount(2)
			await expect(comments.first()).toContainText('Alice Smith')
			
			// Verify back navigation
			await page.click('nav a')
			await expect(page).toHaveURL('http://localhost:3001/')
		})

		test('Hydration works', async ({ page }) => {
			const response = await page.goto('/')
			const html = await response?.text() || ''
			
			// Check SSR content
			expect(html).toContain('Latest Posts')
			expect(html).toContain('First Post')
			
			// Check hydration script tag presence in initial HTML
			expect(html).toContain('pounce-data-')
		})
	})
})

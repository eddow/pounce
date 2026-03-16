import { deletePost, findPost } from '+shared/posts'
import type { SursautRequest } from '@sursaut/board'
import { expose } from '@sursaut/board'

export default expose<{ id: string }>({
	provide: async (req: SursautRequest<{ id: string }>) => {
		const post = findPost(req.params.id)
		return { post: post ?? null }
	},

	get: async (req: SursautRequest<{ id: string }>) => {
		const post = findPost(req.params.id)
		if (!post) return new Response('Not found', { status: 404 })
		return post
	},

	put: async (req: SursautRequest<{ id: string }>) => {
		const post = findPost(req.params.id)
		if (!post) return new Response('Not found', { status: 404 })
		const body = await req.raw.json()
		Object.assign(post, body)
		return post
	},

	delete: async (req: SursautRequest<{ id: string }>) => {
		if (!deletePost(req.params.id)) return new Response('Not found', { status: 404 })
		return { deleted: true }
	},
})

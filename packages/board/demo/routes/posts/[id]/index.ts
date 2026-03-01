import { expose } from '@pounce/board'
import { posts } from '../index.js'

const findPost = (id: string) => posts.find(p => p.id === id)

export default expose<{ id: string }>({
  provide: async (req) => {
    const post = findPost(req.params.id)
    return { post: post ?? null }
  },

  get: async (req) => {
    const post = findPost(req.params.id)
    if (!post) return new Response('Not found', { status: 404 })
    return post
  },

  put: async (req) => {
    const post = findPost(req.params.id)
    if (!post) return new Response('Not found', { status: 404 })
    const body = await req.raw.json()
    Object.assign(post, body)
    return post
  },

  delete: async (req) => {
    const idx = posts.findIndex(p => p.id === req.params.id)
    if (idx === -1) return new Response('Not found', { status: 404 })
    posts.splice(idx, 1)
    return { deleted: true }
  },
})

import { expose } from '@sursaut/board'
import type { SursautRequest } from '@sursaut/board'
import { createPost, posts } from '+shared/posts'

export default expose({
  middle: [
    async (req: SursautRequest, next) => {
      const start = Date.now()
      const res = await next()
      res.headers.set('X-Response-Time', `${Date.now() - start}ms`)
      return res
    },
  ],

  provide: async () => ({ posts }),

  get: async () => posts,

  post: async (req) => {
    const body = await req.raw.json()
    return createPost({ title: body.title, content: body.content })
  },
})

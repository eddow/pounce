import { expose } from '@pounce/board'
import type { PounceRequest } from '@pounce/board'
import { createPost, posts } from '+shared/posts'

export default expose({
  middle: [
    async (req: PounceRequest, next) => {
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

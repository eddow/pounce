import { expose } from '@pounce/board'
import type { PounceRequest } from '@pounce/board'

export const posts = [
  { id: '1', title: 'First Post', content: 'Hello World' },
  { id: '2', title: 'Pounce Board', content: 'Is awesome' },
]
let nextId = 3

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
    const post = { id: String(nextId++), title: body.title, content: body.content }
    posts.push(post)
    return post
  },
})

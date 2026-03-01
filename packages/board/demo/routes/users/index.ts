import { expose } from '@pounce/board'
import type { PounceRequest, MiddleNext } from '@pounce/board'

const requireAuth = async (req: PounceRequest, next: MiddleNext) => {
  const token = req.raw.headers.get('Authorization')
  if (!token) return new Response('Unauthorized', { status: 401 })
  ;(req as any).user = { id: 'admin', role: 'root' }
  return next()
}

export const users = [
  { id: '1', name: 'Alice', role: 'admin' },
  { id: '2', name: 'Bob', role: 'user' },
]

export default expose({
  middle: [requireAuth],

  provide: async () => ({ users }),

  get: async () => users,
})

import { expose } from '@pounce/board'
import type { PounceRequest } from '@pounce/board'
import { findUser } from '+shared/users'

export default expose<{ id: string }>({
  provide: async (req: PounceRequest<{ id: string }>) => {
    const user = findUser(req.params.id)
    return { user: user ?? null }
  },

  get: async (req: PounceRequest<{ id: string }>) => {
    const user = findUser(req.params.id) || { id: req.params.id, name: `User ${req.params.id}`, role: 'guest' }
    return {
      ...user,
      contextUser: (req as any).user,
      requestTimestamp: (req as any).requestTimestamp
    }
  },
})

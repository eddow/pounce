import { expose } from '@pounce/board'
import { users } from '../index.js'

export default expose<{ id: string }>({
  provide: async (req) => {
    const user = users.find(u => u.id === req.params.id)
    return { user: user ?? null }
  },

  get: async (req) => {
    const user = users.find(u => u.id === req.params.id) || { id: req.params.id, name: `User ${req.params.id}`, role: 'guest' }
    return {
      ...user,
      contextUser: (req as any).user,
      requestTimestamp: (req as any).requestTimestamp
    }
  },
})

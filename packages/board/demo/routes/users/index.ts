import { users } from '+shared/users'
import type { MiddleNext, SursautRequest } from '@sursaut/board'
import { expose } from '@sursaut/board'

const requireAuth = async (req: SursautRequest, next: MiddleNext) => {
	const token = req.raw.headers.get('Authorization')
	if (!token) return new Response('Unauthorized', { status: 401 })
	;(req as any).user = { id: 'admin', role: 'root' }
	return next()
}

export default expose({
	middle: [requireAuth],

	provide: async () => ({ users }),

	get: async () => users,
})

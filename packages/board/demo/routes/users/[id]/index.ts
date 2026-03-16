import { findUser } from '+shared/users'
import type { SursautRequest } from '@sursaut/board'
import { expose } from '@sursaut/board'

export default expose<{ id: string }>({
	provide: async (req: SursautRequest<{ id: string }>) => {
		const user = findUser(req.params.id)
		return { user: user ?? null }
	},

	get: async (req: SursautRequest<{ id: string }>) => {
		const user = findUser(req.params.id) || {
			id: req.params.id,
			name: `User ${req.params.id}`,
			role: 'guest',
		}
		return {
			...user,
			contextUser: (req as any).user,
			requestTimestamp: (req as any).requestTimestamp,
		}
	},
})

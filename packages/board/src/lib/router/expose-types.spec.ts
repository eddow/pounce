import { describe, expectTypeOf, it } from 'vitest'
import type { InferPath, InferProvide, InferVerb, SursautRequest } from './expose-types.js'

describe('expose-types type extraction', () => {
	it('should infer correctly', () => {
		const MockRoute = {
			get: async () => ({ rootData: true }),
			provide: async () => ({ user: 'admin' }),
			'/[id]': {
				get: async (req: SursautRequest<{ id: string }>) => ({ id: req.params.id }),
				'/settings': {
					post: async () => ({ saved: true }),
				},
			},
		}

		type RootGet = InferVerb<typeof MockRoute, 'get'>
		type RootProvide = InferProvide<typeof MockRoute>

		expectTypeOf<RootGet>().toEqualTypeOf<{ rootData: boolean }>()
		expectTypeOf<RootProvide>().toEqualTypeOf<{ user: string }>()

		type IdGet = InferPath<typeof MockRoute, '/[id]/get'>
		type SettingsPost = InferPath<typeof MockRoute, '/[id]/settings/post'>

		// We expect these to match the awaited return types of their respective verbs
		expectTypeOf<IdGet>().toEqualTypeOf<{ id: string }>()
		expectTypeOf<SettingsPost>().toEqualTypeOf<{ saved: boolean }>()
	})
})

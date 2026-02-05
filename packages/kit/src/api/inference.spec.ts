/**
 * Test route parameter type inference
 */
import type { ExtractPathParams } from './inference'

describe('Route Parameter Inference', () => {
	it('should extract single parameters', () => {
		type Params = ExtractPathParams<'/users/[id]'>
		expectTypeOf<Params>().toEqualTypeOf<{ id: string }>()
	})

	it('should extract multiple parameters', () => {
		type Params = ExtractPathParams<'/users/[id]/posts/[postId]'>
		expectTypeOf<Params>().toEqualTypeOf<{ id: string; postId: string }>()
	})

	it('should return empty object for routes with no params', () => {
		type Params = ExtractPathParams<'/users/all'>
		expectTypeOf<Params>().toEqualTypeOf<{}>()
	})

	it('should ignore absolute URLs', () => {
		type Params = ExtractPathParams<'https://example.com/users/[id]'>
		// Based on my implementation: T extends `http${string}` ? Record<string, never>
		expectTypeOf<Params>().toEqualTypeOf<{}>()
	})

	it('should handle multiple params segments', () => {
		type Params = ExtractPathParams<'/a/[x]/b/[y]'>
		expectTypeOf<Params>().toEqualTypeOf<{ x: string; y: string }>()
	})
})

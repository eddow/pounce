import { describe, expect, test, vi } from 'vitest'
import { type RouterModelRouteDefinition, routerModel } from './router-model'

type DemoRoute = { readonly path: string }

function createRoutes(): readonly RouterModelRouteDefinition<DemoRoute>[] {
	return [
		{
			path: '/users/[id]',
			view: () => [] as unknown as JSX.Element[],
			title: (params) => `User ${params.id}`,
		},
		{
			path: '/agents',
			view: () => [] as unknown as JSX.Element[],
			title: 'Agents',
		},
		{
			path: '/',
			view: () => [] as unknown as JSX.Element[],
			title: 'Home',
		},
	]
}

describe('routerModel', () => {
	const routes = createRoutes()

	test('open() adds a route and sets it active', () => {
		const model = routerModel({ routes })

		const opened = model.open('/agents')

		expect(opened).not.toBeNull()
		expect(opened?.id).toBe('/agents')
		expect(opened?.title).toBe('Agents')
		expect(model.opened).toHaveLength(1)
		expect(model.active?.id).toBe('/agents')
	})

	test('open() with the same url activates the existing route without duplication', () => {
		const model = routerModel({ routes })

		const first = model.open('/users/42')
		const second = model.open('/users/42')

		expect(first?.id).toBe(second?.id)
		expect(model.active?.id).toBe('/users/42')
		expect(model.opened).toHaveLength(1)
		expect(model.active?.title).toBe('User 42')
	})

	test('activate() switches active route without modifying opened routes', () => {
		const model = routerModel({ routes })
		model.open('/agents')
		model.open('/users/42')

		model.activate('/agents')

		expect(model.opened).toHaveLength(2)
		expect(model.active?.id).toBe('/agents')
	})

	test('close() removes a non-active route and keeps the current active one', () => {
		const model = routerModel({ routes })
		model.open('/agents')
		model.open('/users/42')

		model.close('/agents')

		expect(model.opened).toHaveLength(1)
		expect(model.active?.id).toBe('/users/42')
	})

	test('close() activates a neighbor when closing the active route', () => {
		const model = routerModel({ routes })
		model.open('/agents')
		model.open('/users/42')
		model.open('/')

		model.close('/users/42')

		expect(model.opened.map((entry) => entry.id)).toEqual(['/agents', '/'])
		expect(model.active?.id).toBe('/')
	})

	test('clear() empties opened routes and clears active route', () => {
		const model = routerModel({ routes })
		model.open('/agents')
		model.open('/users/42')

		model.clear()

		expect(model.opened).toHaveLength(0)
		expect(model.active).toBeNull()
	})

	test('open() returns null and calls notFound when no exact route matches', () => {
		const notFound = vi.fn(() => [] as unknown as JSX.Element[])
		const model = routerModel({ routes, notFound })

		const opened = model.open('/missing/path')

		expect(opened).toBeNull()
		expect(model.opened).toHaveLength(0)
		expect(model.active).toBeNull()
		expect(notFound).toHaveBeenCalledTimes(1)
		expect(notFound).toHaveBeenCalledWith({ routes, url: '/missing/path' }, {})
	})

	test('lifecycle hooks fire for matched routes', () => {
		const onRouteStart = vi.fn()
		const onRouteEnd = vi.fn()
		const model = routerModel({ routes, onRouteStart, onRouteEnd })

		model.open('/users/42')

		expect(onRouteStart).toHaveBeenCalledTimes(1)
		expect(onRouteEnd).toHaveBeenCalledTimes(1)
		expect(onRouteStart.mock.calls[0]?.[0]).toMatchObject({
			from: undefined,
			to: '/users/42',
		})
		expect(onRouteEnd.mock.calls[0]?.[0]).toMatchObject({
			from: '/users/42',
			to: '/users/42',
			status: 'match',
		})
	})

	test('getRouteId customizes deduplication identity', () => {
		const model = routerModel({
			routes,
			getRouteId: (match) => `${match.definition.path}:${match.params.id ?? ''}`,
		})

		model.open('/users/42')
		model.open('/users/42?tab=details')

		expect(model.opened).toHaveLength(1)
		expect(model.active?.id).toBe('/users/[id]:42')
	})
})

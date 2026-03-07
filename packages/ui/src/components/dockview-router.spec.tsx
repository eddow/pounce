import { h, PounceElement } from '@pounce/core'
import type { DockviewApi } from 'dockview-core'
import { describe, expect, it, vi } from 'vitest'
import { type DockviewRouteWidgetParams, dockviewRouterInternals } from './dockview-router'

type DemoRoute = { readonly path: string }

function renderToText(element: JSX.Element | JSX.Element[]) {
	const item = Array.isArray(element) ? element[0] : element
	if (!(item instanceof PounceElement)) throw new Error('Expected PounceElement')
	const nodes = item.render({})
	const array = Array.isArray(nodes) ? nodes : Array.from(nodes as Iterable<Node>)
	return array.map((node) => node.textContent ?? '').join('')
}

function createRoutes() {
	return [
		{
			path: '/users/[id]',
			view: (spec: { params: Record<string, string> }) => h('div', {}, `User ${spec.params.id}`),
			title: (params: Record<string, string>) => `User ${params.id}`,
		},
		{
			path: '/lazy',
			lazy: async () => ({ default: () => h('div', {}, 'Lazy') }),
		},
	] as const
}

describe('dockviewRouterInternals', () => {
	it('creates one route widget per route path and keeps extra widgets', () => {
		const routes = createRoutes()
		const widgets = dockviewRouterInternals.createRouteWidgets(
			{
				routes,
				extraWidgets: { custom: () => h('div', {}, 'Custom') },
			},
			{
				matcher: vi.fn(),
				open: vi.fn(),
				close: vi.fn(),
				activate: vi.fn(),
				clear: vi.fn(),
				active: null,
				opened: [],
			}
		)

		expect(Object.keys(widgets).sort()).toEqual(['/lazy', '/users/[id]', 'custom'])
	})

	it('renders eager route widgets from the matched url', () => {
		const routes = createRoutes()
		const model = {
			matcher: vi.fn((url: string) =>
				url === '/users/42'
					? {
							definition: routes[0],
							params: { id: '42' },
							unusedPath: '',
						}
					: null
			),
			open: vi.fn(),
			close: vi.fn(),
			activate: vi.fn(),
			clear: vi.fn(),
			active: null,
			opened: [],
		}
		const widgets = dockviewRouterInternals.createRouteWidgets({ routes }, model as never)
		const widget = widgets['/users/[id]']

		const output = widget(
			{
				title: 'User 42',
				size: { width: 100, height: 100 },
				context: {},
				params: {
					url: '/users/42',
					routeId: '/users/42',
					id: '42',
				} satisfies DockviewRouteWidgetParams,
			},
			{}
		)

		expect(renderToText(output)).toContain('User 42')
	})

	it('falls back to loading placeholder for lazy routes in the shell', () => {
		const routes = createRoutes()
		const model = {
			matcher: vi.fn(() => ({ definition: routes[1], params: {}, unusedPath: '' })),
			open: vi.fn(),
			close: vi.fn(),
			activate: vi.fn(),
			clear: vi.fn(),
			active: null,
			opened: [],
		}
		const widgets = dockviewRouterInternals.createRouteWidgets({ routes }, model as never)
		const widget = widgets['/lazy']

		const output = widget(
			{
				title: 'Lazy',
				size: { width: 100, height: 100 },
				context: {},
				params: { url: '/lazy', routeId: '/lazy' } satisfies DockviewRouteWidgetParams,
			},
			{}
		)

		expect(renderToText(output)).toContain('Loading route…')
	})

	it('opens matched routes into dockview panels using route-derived params', () => {
		const panel = { id: '/users/42', api: { setActive: vi.fn() } }
		const api = {
			panels: [],
			activePanel: null,
			addPanel: vi.fn(() => panel),
		} as unknown as DockviewApi
		const opened = {
			id: '/users/42',
			url: '/users/42',
			title: 'User 42',
			match: {
				definition: createRoutes()[0],
				params: { id: '42' },
				unusedPath: '',
			},
		}

		dockviewRouterInternals.openRoutePanel(api, opened as never)

		expect(api.addPanel as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
			expect.objectContaining({
				id: '/users/42',
				title: 'User 42',
				component: '/users/[id]',
				params: { id: '42', url: '/users/42', routeId: '/users/42' },
			})
		)
	})

	it('syncs the active dockview route back to the client URL only when needed', () => {
		const replace = vi.fn()

		expect(dockviewRouterInternals.syncActiveRouteToUrl('/users/42', '/start', replace)).toBe(true)
		expect(replace).toHaveBeenCalledWith('/users/42')
		expect(dockviewRouterInternals.syncActiveRouteToUrl('/users/42', '/users/42', replace)).toBe(
			false
		)
	})

	it('opens a new tab on push navigation even if the same URL is already active', () => {
		const opened = {
			id: '/users/42#2',
			url: '/users/42',
			title: 'User 42',
			match: { definition: createRoutes()[0], params: { id: '42' }, unusedPath: '' },
		}
		const api = {
			panels: [],
			activePanel: null,
			addPanel: vi.fn(() => ({ id: opened.id, api: { setActive: vi.fn() } })),
		} as unknown as DockviewApi
		const model = {
			active: { id: '/users/42#1', url: '/users/42', title: 'User 42', match: opened.match },
			opened: [],
			matcher: vi.fn(),
			open: vi.fn(() => opened),
			close: vi.fn(),
			activate: vi.fn(),
			clear: vi.fn(),
		}

		const result = dockviewRouterInternals.syncClientRouteToDockview(api, model as never, {
			url: '/users/42',
			navigation: 'push',
		})

		expect(result).toBe(opened)
		expect(model.open).toHaveBeenCalledWith('/users/42')
		expect(api.addPanel as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1)
	})

	it('reuses an existing tab on non-push navigation when the URL is already open', () => {
		const existing = {
			id: '/users/42#2',
			url: '/users/42',
			title: 'User 42',
			match: { definition: createRoutes()[0], params: { id: '42' }, unusedPath: '' },
		}
		const setActive = vi.fn()
		const api = {
			panels: [{ id: existing.id, api: { setActive } }],
			activePanel: null,
			addPanel: vi.fn(),
		} as unknown as DockviewApi
		const model = {
			active: {
				id: '/users/1#1',
				url: '/users/1',
				title: 'User 1',
				match: { definition: createRoutes()[0], params: { id: '1' }, unusedPath: '' },
			},
			opened: [existing],
			matcher: vi.fn(),
			open: vi.fn(),
			close: vi.fn(),
			activate: vi.fn(),
			clear: vi.fn(),
		}

		const result = dockviewRouterInternals.syncClientRouteToDockview(api, model as never, {
			url: '/users/42',
			navigation: 'replace',
		})

		expect(result).toBe(existing)
		expect(model.activate).toHaveBeenCalledWith(existing.id)
		expect(setActive).toHaveBeenCalledTimes(1)
		expect(model.open).not.toHaveBeenCalled()
		expect(api.addPanel as unknown as ReturnType<typeof vi.fn>).not.toHaveBeenCalled()
	})

	it('reconciles the model with dockview panel removal and active panel changes', () => {
		const active = {
			id: '/users/2#1',
			url: '/users/2',
			title: 'User 2',
			match: { definition: createRoutes()[0], params: { id: '2' }, unusedPath: '' },
		}
		const model: {
			active: typeof active | null
			opened: Array<{
				id: string
				url: string
				title: string
				match: typeof active.match
			}>
			matcher: ReturnType<typeof vi.fn>
			open: ReturnType<typeof vi.fn>
			close: ReturnType<typeof vi.fn>
			activate: ReturnType<typeof vi.fn>
			clear: ReturnType<typeof vi.fn>
		} = {
			active: null,
			opened: [
				{
					id: '/users/1#1',
					url: '/users/1',
					title: 'User 1',
					match: { definition: createRoutes()[0], params: { id: '1' }, unusedPath: '' },
				},
				active,
			],
			matcher: vi.fn(),
			open: vi.fn(),
			close: vi.fn(),
			activate: vi.fn(() => {
				model.active = active
			}),
			clear: vi.fn(),
		}
		const api = {
			panels: [{ id: '/users/2#1', api: { setActive: vi.fn() } }],
			activePanel: { id: '/users/2#1', api: { setActive: vi.fn() } },
		} as unknown as DockviewApi

		const result = dockviewRouterInternals.reconcileDockviewRouteState(api, model as never)

		expect(model.close).toHaveBeenCalledWith('/users/1#1')
		expect(model.activate).toHaveBeenCalledWith('/users/2#1')
		expect(result).toBe(active)
	})
})

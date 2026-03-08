import { h } from '@pounce/core'
import type { DockviewPanelApi, GroupPanelPartInitParameters } from 'dockview-core'
import { effect, reactive } from 'mutts'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	type DockviewWidget,
	type DockviewWidgetProps,
	type DockviewWidgetScope,
	dockviewInternals,
} from './dockview'

type DemoContext = { badge?: string }
type DemoParams = { panelId: string }

function createPanelApi() {
	let titleListener: ((value: { title: string } | string) => void) | undefined
	let paramsListener: ((value: Record<string, unknown>) => void) | undefined
	const api = {
		id: 'panel-1',
		close: vi.fn(),
		setTitle: vi.fn(),
		updateParameters: vi.fn(),
		onDidTitleChange(listener: (value: { title: string } | string) => void) {
			titleListener = listener
			return { dispose: vi.fn() }
		},
		onDidParametersChange(listener: (value: Record<string, unknown>) => void) {
			paramsListener = listener
			return { dispose: vi.fn() }
		},
	}
	return {
		api: api as unknown as DockviewPanelApi,
		fireTitle(value: { title: string } | string) {
			titleListener?.(value)
		},
		fireParams(value: Record<string, unknown>) {
			paramsListener?.(value)
		},
		spies: api,
	}
}

function noop() {
	return h('div', {})
}

describe('Dockview renderer internals', () => {
	afterEach(() => {
		document.body.innerHTML = ''
	})

	it('shares a reactive context between widget and tab, and injects scope', () => {
		const shared = reactive({ value: 1 })
		const captured: { widget?: DockviewWidgetScope; tab?: DockviewWidgetScope } = {}
		const panel = createPanelApi()
		const props: Partial<DockviewWidgetProps<DemoParams, DemoContext>> = {
			context: reactive({}),
		}
		const scope = { api: { id: 'dockview-api' } }

		const Widget: DockviewWidget<any, any> = (wp, sc) => {
			captured.widget = sc
			effect(() => {
				wp.context.badge = String(shared.value)
			})
			return noop()
		}

		const Tab: DockviewWidget<any, any> = (_tp, sc) => {
			captured.tab = sc
			return noop()
		}

		const content = dockviewInternals.contentRenderer(Widget, props, vi.fn(), scope, (fn) =>
			effect(fn)
		)
		document.body.appendChild(content.element)
		content.init({
			api: panel.api,
			params: { panelId: 'counter-1' },
			title: 'Counter 1',
			containerApi: scope.api as never,
		} satisfies GroupPanelPartInitParameters)

		const tab = dockviewInternals.tabRenderer(Tab, props as DockviewWidgetProps, scope, (fn) =>
			effect(fn)
		)
		document.body.appendChild(tab.element)
		tab.init({
			api: panel.api,
			params: { panelId: 'counter-1' },
			title: 'Counter 1',
			containerApi: scope.api as never,
		} satisfies GroupPanelPartInitParameters)

		// Shared reactive context is visible from both widget and tab
		expect((props.context as DemoContext).badge).toBe('1')

		// Scope injection: both widget and tab receive dockviewApi and panelApi
		expect(captured.widget?.dockviewApi).toBe(scope.api)
		expect(captured.tab?.dockviewApi).toBe(scope.api)
		expect(captured.widget?.panelApi).toBe(panel.api)
		expect(captured.tab?.panelApi).toBe(panel.api)

		// Reactive context flows across: mutating source updates context on props
		shared.value = 42
		expect((props.context as DemoContext).badge).toBe('42')

		content.dispose?.()
		tab.dispose?.()
	})

	it('title setter calls panelApi.setTitle and params update flows through', () => {
		const panel = createPanelApi()
		const props: Partial<DockviewWidgetProps<DemoParams, DemoContext>> = {
			context: reactive({}),
		}
		const scope = { api: { id: 'dockview-api' } }

		const content = dockviewInternals.contentRenderer(
			noop as DockviewWidget,
			props,
			vi.fn(),
			scope,
			(fn) => effect(fn)
		)
		document.body.appendChild(content.element)
		content.init({
			api: panel.api,
			params: { panelId: 'counter-1' },
			title: 'Counter 1',
			containerApi: scope.api as never,
		} satisfies GroupPanelPartInitParameters)

		// Title getter returns the initial title
		const typed = props as DockviewWidgetProps<DemoParams, DemoContext>
		expect(typed.title).toBe('Counter 1')

		// Title setter delegates to panelApi.setTitle
		typed.title = 'Renamed'
		expect(panel.spies.setTitle).toHaveBeenCalledWith('Renamed')
		expect(typed.title).toBe('Renamed')

		// External title change via onDidTitleChange listener
		panel.fireTitle({ title: 'External' })
		expect(typed.title).toBe('External')

		// Params update via onDidParametersChange listener
		panel.fireParams({ panelId: 'counter-9' })
		expect(typed.params.panelId).toBe('counter-9')

		content.dispose?.()
	})

	it('calls onPanelError when a panel widget throws', () => {
		const panel = createPanelApi()
		const props: Partial<DockviewWidgetProps<DemoParams, DemoContext>> = {
			context: reactive({}),
		}
		const scope = { api: { id: 'dockview-api' } }
		const onPanelError = vi.fn()
		const Widget: DockviewWidget<any, any> = () => {
			throw new Error('boom')
		}

		const content = dockviewInternals.contentRenderer(
			Widget,
			props,
			vi.fn(),
			scope,
			(fn) => effect(fn),
			onPanelError
		)
		document.body.appendChild(content.element)
		content.init({
			api: panel.api,
			params: { panelId: 'counter-1' },
			title: 'Counter 1',
			containerApi: scope.api as never,
		} satisfies GroupPanelPartInitParameters)

		expect(onPanelError).toHaveBeenCalledTimes(1)
		expect(onPanelError).toHaveBeenCalledWith('panel-1', expect.any(Error), content.element)
		expect((onPanelError.mock.calls[0]?.[1] as Error).message).toBe('boom')

		content.dispose?.()
	})
})

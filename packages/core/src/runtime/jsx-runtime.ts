import { type Child, Fragment as FragmentImpl, h } from '../lib'

type Key = string | number | null

function toChildArray(children: unknown): unknown[] {
	if (children === undefined || children === null) return []
	return Array.isArray(children) ? children : [children]
}

function createVNode(type: any, props?: Record<string, unknown> | null, maybeKey?: Key) {
	const preparedProps: Record<string, unknown> = props ? { ...props } : {}
	const childArray = toChildArray(preparedProps.children)
	delete preparedProps.children

	if (maybeKey !== undefined && maybeKey !== null) {
		preparedProps.key ??= maybeKey
	}

	return h(type, preparedProps, ...(childArray as Child[]))
}

export const Fragment = FragmentImpl

export function jsx(type: any, props: Record<string, unknown> | null, key?: Key) {
	return createVNode(type, props, key ?? null)
}

export const jsxs = jsx

export function jsxDEV(
	type: any,
	props: Record<string, unknown> | null,
	key?: Key,
	_isStaticChildren?: boolean,
	_source?: unknown,
	_self?: unknown
) {
	return createVNode(type, props, key)
}

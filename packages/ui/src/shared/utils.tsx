import { extend } from '@sursaut/core'
import type { DisplayContext } from '@sursaut/kit'
import type { ArrangedClassConfig, ArrangedClassKey, ArrangedProps } from './types'

/**
 * Wraps array children in a `<span>` so they form a single flex item (needed when CSS `order` is used).
 * Single elements and primitives are returned as-is.
 */
export function gather(children: JSX.Children): JSX.Element {
	return Array.isArray(children) ? <span>{children}</span> : (children as JSX.Element)
}

/** Generates a short random DOM-safe id string */
export function generateId(prefix = 'sursaut'): string {
	return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export const isDev: boolean = (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false

export type LogicalSide = 'start' | 'end' | 'left' | 'right'
export type PhysicalSide = 'left' | 'right'

export function relativeSide(dc: DisplayContext, side: LogicalSide = 'start'): PhysicalSide {
	if (side === 'left' || side === 'right') return side
	const direction = dc.direction === 'rtl' ? 'rtl' : 'ltr'
	if (side === 'end') return direction === 'rtl' ? 'left' : 'right'
	return direction === 'rtl' ? 'right' : 'left'
}

export type ArrangedValue = Required<
	Pick<ArrangedProps, 'orientation' | 'density' | 'joined' | 'align'>
>

export type ArrangedState = ArrangedValue & {
	readonly class: JSX.ClassValue
}

export type ArrangedScope = {
	arranged?: ArrangedState
}

function arrangedComputer(
	scope: Record<PropertyKey, unknown>,
	props: ArrangedProps = {}
): ArrangedState {
	const inherited = (scope as ArrangedScope).arranged
	if (
		inherited &&
		props.orientation === undefined &&
		props.density === undefined &&
		props.joined === undefined &&
		props.align === undefined
	) {
		return inherited
	}

	return (scope.arranged = extend(inherited ?? null, {
		get orientation() {
			return props.orientation ?? inherited?.orientation ?? 'horizontal'
		},
		get density() {
			return props.density ?? inherited?.density ?? 'regular'
		},
		get joined() {
			return props.joined ?? inherited?.joined ?? false
		},
		get align() {
			return props.align ?? inherited?.align ?? 'center'
		},
		get class() {
			const orientationKey = `orientation:${this.orientation}` as ArrangedClassKey
			const densityKey = `density:${this.density}` as ArrangedClassKey
			const joinedKey = `joined:${String(this.joined)}` as ArrangedClassKey
			const alignKey = `align:${this.align}` as ArrangedClassKey
			return [
				arranged[orientationKey],
				arranged[densityKey],
				arranged[joinedKey],
				arranged[alignKey],
			]
		},
	}))
}

export const arranged: ((
	scope: Record<PropertyKey, unknown>,
	props?: ArrangedProps
) => ArrangedState) &
	ArrangedClassConfig = Object.assign(arrangedComputer, {
	'orientation:horizontal': 'orientation-horizontal',
	'orientation:vertical': 'orientation-vertical',
	'density:regular': 'density-regular',
	'density:compact': 'density-compact',
	'joined:true': 'joined-true',
	'joined:false': 'joined-false',
	'align:start': 'align-start',
	'align:center': 'align-center',
	'align:stretch': 'align-stretch',
})

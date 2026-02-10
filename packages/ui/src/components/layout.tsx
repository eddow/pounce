import { effect, reactive } from 'mutts'
import { compose } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter/registry'

componentStyle.sass`
.pounce-stack
	display: flex
	flex-direction: column
	gap: var(--pounce-spacing)
	overflow: visible

.pounce-inline
	display: flex
	align-items: center
	gap: calc(var(--pounce-spacing) * 0.75)
	overflow: visible

.pounce-inline--scrollable
	overflow-x: auto

.pounce-grid
	display: grid
	gap: var(--pounce-spacing)

.pounce-app-shell
	min-height: 100vh
	display: flex
	flex-direction: column

.pounce-app-shell-header
	position: sticky
	top: 0
	z-index: var(--pounce-app-shell-z, 100)
	background: var(--pounce-app-shell-bg, var(--pounce-bg, #fff))

.pounce-app-shell-header--shadow
	box-shadow: var(--pounce-app-shell-shadow, 0 2px 4px rgba(0, 0, 0, 0.08))

.pounce-app-shell-main
	flex: 1 0 auto
`

type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string

const spacingScale: Record<Exclude<SpacingToken, string>, string> = {
	none: '0',
	xs: 'calc(var(--pounce-spacing) * 0.5)',
	sm: 'var(--pounce-spacing)',
	md: 'calc(var(--pounce-spacing) * 1.5)',
	lg: 'calc(var(--pounce-spacing) * 2)',
	xl: 'calc(var(--pounce-spacing) * 3)',
}

function spacingValue(value?: SpacingToken) {
	if (!value) return undefined
	return spacingScale[value as Exclude<SpacingToken, string>] ?? value
}

const alignItemsMap = {
	start: 'flex-start',
	center: 'center',
	end: 'flex-end',
	baseline: 'baseline',
	stretch: 'stretch',
} as const

const justifyMap = {
	start: 'flex-start',
	center: 'center',
	end: 'flex-end',
	between: 'space-between',
	around: 'space-around',
	evenly: 'space-evenly',
	stretch: 'stretch',
} as const

export type ContainerProps = JSX.IntrinsicElements['div'] & {
	tag?: JSX.HTMLElementTag
	fluid?: boolean
}

export const Container = (props: ContainerProps) => {
	const adapter = getAdapter('Layout')
	const state = compose({ tag: 'div' }, props)

	return (
		<dynamic class={[state.fluid ? (adapter.classes?.containerFluid || 'container-fluid') : (adapter.classes?.container || 'container'), state.class]} {...state}>
			{state.children}
		</dynamic>
	)
}

export type AppShellProps = {
	header: JSX.Element
	children?: JSX.Children
	shadowOnScroll?: boolean
}

export const AppShell = (props: AppShellProps) => {
	const state = reactive({
		headerEl: undefined as HTMLElement | undefined,
	})

	if (props.shadowOnScroll !== false && typeof window !== 'undefined') {
		effect(() => {
			if (!state.headerEl) return
			const onScroll = () => {
				const scrolled = window.scrollY > 0
				state.headerEl!.classList.toggle('pounce-app-shell-header--shadow', scrolled)
			}
			onScroll()
			window.addEventListener('scroll', onScroll, { passive: true })
			return () => window.removeEventListener('scroll', onScroll)
		})
	}

	return (
		<div class="pounce-app-shell">
			<header this={state.headerEl} class="pounce-app-shell-header">
				{props.header}
			</header>
			<main class="pounce-app-shell-main">{props.children}</main>
		</div>
	)
}

export type StackProps = JSX.IntrinsicElements['div'] & {
	gap?: SpacingToken
	align?: keyof typeof alignItemsMap
	justify?: keyof typeof justifyMap
}

export const Stack = (props: StackProps) => {
	const adapter = getAdapter('Layout')
	const state = compose({ gap: 'md' }, props)

	return (
		<div
			{...state}
			class={[adapter.classes?.base || 'pounce-stack', state.class]}
			style={[
				state.style,
				state.gap ? { gap: spacingValue(state.gap) } : undefined,
				state.align ? { alignItems: alignItemsMap[state.align] ?? state.align } : undefined,
				state.justify ? { justifyContent: justifyMap[state.justify] ?? state.justify } : undefined,
			]}
		>
			{props.children}
		</div>
	)
}

export type InlineProps = JSX.IntrinsicElements['div'] & {
	gap?: SpacingToken
	align?: keyof typeof alignItemsMap
	justify?: keyof typeof justifyMap
	wrap?: boolean
	scrollable?: boolean
}

export const Inline = (props: InlineProps) => {
	const adapter = getAdapter('Layout')
	const state = compose({ gap: 'sm', align: 'center' as keyof typeof alignItemsMap }, props)

	return (
		<div
			{...state}
			class={[adapter.classes?.inline || 'pounce-inline', state.scrollable ? 'pounce-inline--scrollable' : undefined, state.class]}
			style={[
				state.style,
				state.gap ? { gap: spacingValue(state.gap) } : undefined,
				state.align ? { alignItems: alignItemsMap[state.align] ?? state.align } : undefined,
				state.justify ? { justifyContent: justifyMap[state.justify] ?? state.justify } : undefined,
				state.wrap ? { flexWrap: 'wrap' } : { flexWrap: 'nowrap' },
			]}
		>
			{state.children}
		</div>
	)
}

export type GridProps = JSX.IntrinsicElements['div'] & {
	gap?: SpacingToken
	columns?: number | string
	minItemWidth?: string
	align?: 'start' | 'center' | 'end' | 'stretch'
	justify?: 'start' | 'center' | 'end' | 'stretch'
}

export const Grid = (props: GridProps) => {
	const adapter = getAdapter('Layout')
	function template(columns?: number | string, minItemWidth?: string) {
		if (columns !== undefined && columns !== null && columns !== '')
			return typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns
		if (minItemWidth) return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
		return undefined
	}
	const state = compose({ gap: 'md' }, props)

	return (
		<div
			{...state}
			class={[adapter.classes?.grid || 'pounce-grid', state.class]}
			style={[
				state.style,
				state.gap ? { gap: spacingValue(state.gap) } : undefined,
				(() => {
					const columns = template(state.columns, state.minItemWidth)
					return columns ? { gridTemplateColumns: columns } : undefined
				})(),
				state.align ? { alignItems: state.align } : undefined,
				state.justify ? { justifyItems: state.justify } : undefined,
			].filter(Boolean)}
		>
			{state.children}
		</div>
	)
}

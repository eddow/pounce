import { defaults } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { effect, reactive } from 'mutts'
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
	return (
		<dynamic
			class={[
				props.fluid
					? adapter.classes?.containerFluid || 'container-fluid'
					: adapter.classes?.container || 'container',
				props.class,
			]}
			tag={props.tag ?? 'div'}
			{...props}
		>
			{props.children}
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
	const p = defaults(props, { gap: 'md' as SpacingToken })

	return (
		<div
			{...props}
			class={[adapter.classes?.base || 'pounce-stack', props.class]}
			style={[
				props.style,
				{ gap: spacingValue(p.gap) },
				props.align ? { alignItems: alignItemsMap[props.align] ?? props.align } : undefined,
				props.justify ? { justifyContent: justifyMap[props.justify] ?? props.justify } : undefined,
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
	const p = defaults(props, {
		gap: 'sm' as SpacingToken,
		align: 'center' as keyof typeof alignItemsMap,
	})

	return (
		<div
			{...props}
			class={[
				adapter.classes?.inline || 'pounce-inline',
				props.scrollable ? 'pounce-inline--scrollable' : undefined,
				props.class,
			]}
			style={[
				props.style,
				{ gap: spacingValue(p.gap) },
				{ alignItems: alignItemsMap[p.align] ?? p.align },
				props.justify ? { justifyContent: justifyMap[props.justify] ?? props.justify } : undefined,
				props.wrap ? { flexWrap: 'wrap' } : { flexWrap: 'nowrap' },
			]}
		>
			{props.children}
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
	const p = defaults(props, { gap: 'md' as SpacingToken })
	function template(columns?: number | string, minItemWidth?: string) {
		if (columns !== undefined && columns !== null && columns !== '')
			return typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns
		if (minItemWidth) return `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
		return undefined
	}
	return (
		<div
			{...props}
			class={[adapter.classes?.grid || 'pounce-grid', props.class]}
			style={[
				props.style,
				{ gap: spacingValue(p.gap) },
				(() => {
					const columns = template(props.columns, props.minItemWidth)
					return columns ? { gridTemplateColumns: columns } : undefined
				})(),
				props.align ? { alignItems: props.align } : undefined,
				props.justify ? { justifyItems: props.justify } : undefined,
			].filter(Boolean)}
		>
			{props.children}
		</div>
	)
}

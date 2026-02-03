import { compose } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter/registry'

componentStyle.sass`
.pounce-toolbar
	display: flex
	align-items: center
	gap: 0.25rem
	padding: 0.25rem

.pounce-toolbar-horizontal
	flex-direction: row

.pounce-toolbar-vertical
	flex-direction: column

.pounce-toolbar button
	margin: 0
	height: calc(var(--pounce-form-height, 2.5rem))
	min-height: calc(var(--pounce-form-height, 2.5rem))

.pounce-toolbar .pounce-button-icon-only,
.pounce-toolbar .pounce-checkbutton-icon-only,
.pounce-toolbar .pounce-radiobutton-icon-only
	aspect-ratio: 1
	min-width: calc(var(--pounce-form-height, 2.5rem))
	width: calc(var(--pounce-form-height, 2.5rem))
	height: calc(var(--pounce-form-height, 2.5rem))
	padding: 0
	display: inline-flex
	align-items: center
	justify-content: center

.pounce-toolbar .pounce-button:not(.pounce-button-icon-only),
.pounce-toolbar .pounce-checkbutton:not(.pounce-checkbutton-icon-only),
.pounce-toolbar .pounce-radiobutton:not(.pounce-radiobutton-icon-only)
	height: calc(var(--pounce-form-height, 2.5rem))
	min-height: calc(var(--pounce-form-height, 2.5rem))
	padding: 0 0.75rem

.pounce-toolbar-spacer
	display: inline-block
	flex: 1
	width: 1px
	min-width: 1px
	min-height: calc(var(--pounce-form-height, 2.5rem))

.pounce-toolbar-spacer-visible
	width: 1px
	min-width: 1px
	flex: none
	background-color: var(--pounce-muted-border, rgba(0, 0, 0, 0.2))
	height: calc(var(--pounce-form-height, 2.5rem))
	margin: 0 0.25rem

.pounce-toolbar-vertical .pounce-toolbar-spacer-visible
	width: auto
	height: 1px
	min-height: 1px
	min-width: 0
	margin: 0.25rem 0

.pounce-toolbar .pounce-buttongroup
	margin: 0

.pounce-toolbar .dropdown
	margin: 0

.pounce-toolbar .dropdown > summary
	list-style: none
	height: calc(var(--pounce-form-height, 2.5rem))
	padding: 0 0.75rem
	display: inline-flex
	align-items: center
	cursor: pointer
	border: 1px solid var(--pounce-muted-border, rgba(0, 0, 0, 0.2))
	border-radius: var(--pounce-border-radius, 0.5rem)
	background-color: var(--pounce-bg, #fff)
	transition: border-color 0.15s ease, box-shadow 0.15s ease

.pounce-toolbar .dropdown > summary::-webkit-details-marker
	display: none

.pounce-toolbar .dropdown > summary:hover
	border-color: var(--pounce-primary, #3b82f6)

.pounce-toolbar .dropdown > summary:focus-visible
	outline: 2px solid var(--pounce-primary, #3b82f6)
	outline-offset: -2px
`

export type ToolbarProps = {
	children?: JSX.Children
	class?: string | string[]
	style?: JSX.CSSProperties
	orientation?: 'horizontal' | 'vertical'
}

const ToolbarComponent = (props: ToolbarProps) => {
	const state = compose({ orientation: 'horizontal' }, props)
	const adapter = getAdapter('Toolbar')

	const baseClass = adapter?.classes?.root ?? 'pounce-toolbar'
	const orientationClass = adapter?.classes?.orientation 
		? adapter.classes.orientation(state.orientation)
		: `pounce-toolbar-${state.orientation}`

	return (
		<div class={[baseClass, orientationClass, state.class]} role="toolbar" style={state.style}>
			{state.children}
		</div>
	)
}

export type ToolbarSpacerProps = {
	visible?: boolean
	width?: string
	class?: string
}

const ToolbarSpacer = (props: ToolbarSpacerProps) => {
	const state = compose({ visible: false }, props)
	const adapter = getAdapter('Toolbar')

	const baseClass = adapter?.classes?.spacer ?? 'pounce-toolbar-spacer'
	const visibleClass = state.visible 
		? (adapter?.classes?.spacerVisible ?? 'pounce-toolbar-spacer-visible')
		: undefined

	return (
		<span
			class={[baseClass, visibleClass, state.class]}
			style={state.width ? `width: ${state.width}; flex: none;` : undefined}
		/>
	)
}

export const Toolbar = Object.assign(ToolbarComponent, {
	Spacer: ToolbarSpacer,
})

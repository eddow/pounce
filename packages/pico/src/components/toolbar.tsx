import { compose } from '@pounce/core'
import { css } from '@pounce/kit'

css`
.pp-toolbar {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem;
}

.pp-toolbar-horizontal {
	flex-direction: row;
}

.pp-toolbar-vertical {
	flex-direction: column;
}

.pp-toolbar button {
	margin: 0;
	height: calc(var(--pico-form-element-height, 2.5rem));
	min-height: calc(var(--pico-form-element-height, 2.5rem));
}

.pp-toolbar .pp-button-icon-only,
.pp-toolbar .pp-checkbutton-icon-only,
.pp-toolbar .pp-radiobutton-icon-only {
	aspect-ratio: 1;
	min-width: calc(var(--pico-form-element-height, 2.5rem));
	width: calc(var(--pico-form-element-height, 2.5rem));
	height: calc(var(--pico-form-element-height, 2.5rem));
	padding: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.pp-toolbar .pp-button:not(.pp-button-icon-only),
.pp-toolbar .pp-checkbutton:not(.pp-checkbutton-icon-only),
.pp-toolbar .pp-radiobutton:not(.pp-radiobutton-icon-only) {
	height: calc(var(--pico-form-element-height, 2.5rem));
	min-height: calc(var(--pico-form-element-height, 2.5rem));
	padding: 0 0.75rem;
}

.pp-toolbar-spacer {
	display: inline-block;
	flex: 1;
	width: 1px;
	min-width: 1px;
	min-height: calc(var(--pico-form-element-height, 2.5rem));
}

.pp-toolbar-spacer-visible {
	width: 1px;
	min-width: 1px;
	flex: none;
	background-color: var(--pico-muted-border-color, rgba(0, 0, 0, 0.2));
	height: calc(var(--pico-form-element-height, 2.5rem));
	margin: 0 0.25rem;
}

.pp-toolbar-vertical .pp-toolbar-spacer-visible {
	width: auto;
	height: 1px;
	min-height: 1px;
	min-width: 0;
	margin: 0.25rem 0;
}

.pp-toolbar .pp-buttongroup {
	margin: 0;
}

.pp-toolbar .dropdown {
	margin: 0;
}

.pp-toolbar .dropdown > summary {
	list-style: none;
	height: calc(var(--pico-form-element-height, 2.5rem));
	padding: 0 0.75rem;
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	border: 1px solid var(--pico-muted-border-color, rgba(0, 0, 0, 0.2));
	border-radius: var(--pico-border-radius, 0.5rem);
	background-color: var(--pico-card-background-color, #fff);
	transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.pp-toolbar .dropdown > summary::-webkit-details-marker {
	display: none;
}

.pp-toolbar .dropdown > summary:hover {
	border-color: var(--pico-primary, #3b82f6);
}

.pp-toolbar .dropdown > summary:focus-visible {
	outline: 2px solid var(--pico-primary, #3b82f6);
	outline-offset: -2px;
}
`

export type ToolbarProps = {
	/** Toolbar children */
	children?: JSX.Children
	/** Additional CSS classes */
	class?: string
	/** Inline styles */
	style?: string
	/** Orientation - horizontal (default) or vertical */
	orientation?: 'horizontal' | 'vertical'
	/**
	 * When true, the toolbar will trap Tab/Shift+Tab and cycle focus across its logical segments
	 * (segments are separated by Toolbar.Spacer). When false (default), Tab leaves the toolbar
	 * and focus moves to the next/previous focusable element outside the toolbar.
	 */
	trapTab?: boolean
}

const ToolbarComponent = (props: ToolbarProps) => {
	const state = compose({ orientation: 'horizontal', trapTab: false }, props)

	return (
		<div
			class={['pp-toolbar', `pp-toolbar-${state.orientation}`, state.class]}
			role="toolbar"
			style={state.style}
			data-trap-tab={state.trapTab ? 'true' : undefined}
		>
			{state.children}
		</div>
	)
}

export type ToolbarSpacerProps = {
	/** Show a visible divider line instead of being invisible */
	visible?: boolean
	/** Fixed width instead of flex-grow (e.g., '1px', '0.5rem') */
	width?: string
	/** Additional CSS classes */
	class?: string
}

const ToolbarSpacer = (props: ToolbarSpacerProps) => {
	const state = compose({ visible: false }, props)

	return (
		<span
			class={[
				'pp-toolbar-spacer',
				state.visible ? 'pp-toolbar-spacer-visible' : undefined,
				state.class,
			]}
			style={state.width ? { width: state.width, flex: 'none' } : undefined}
		/>
	)
}

export const Toolbar = Object.assign(ToolbarComponent, {
	Spacer: ToolbarSpacer,
})

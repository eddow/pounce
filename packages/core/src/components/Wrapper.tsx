/**
 * Wrapper Component to demonstrate children usage
 */

import { compose } from '../lib'
import './Wrapper.scss'

export default function WrapperComponent(props: {
	title?: string
	description?: string
	class?: string
	showChildren?: boolean
	maxChildren?: number
	children?: JSX.Element | JSX.Element[]
	tag?: JSX.HTMLElementTag
}) {
	const state = compose(
		{
			title: 'Wrapper Component',
			description: 'This wrapper contains children:',
			class: 'wrapper',
			showChildren: true,
			tag: 'div',
		},
		props
	)

	const childrenArray = Array.isArray(state.children)
		? state.children
		: state.children
			? [state.children]
			: []
	const childrenToShow = () =>
		state.maxChildren ? childrenArray.slice(0, state.maxChildren) : childrenArray
	return (
		<dynamic tag={state.tag} class={state.class}>
			<h3>{state.title}</h3>
			<p>{state.description}</p>
			{state.showChildren && <div class="children">{childrenToShow()}</div>}
		</dynamic>
	)
}

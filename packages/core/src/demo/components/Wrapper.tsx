import { memoize } from 'mutts'
import { extend } from '../../lib'
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
	const state = extend(
		{
			title: 'Wrapper Component',
			description: 'This wrapper contains children:',
			class: 'wrapper',
			showChildren: true,
			tag: 'div',
		},
		props
	)

	const computed = memoize({
		get childrenArray() {
			return Array.isArray(state.children) ? state.children : state.children ? [state.children] : []
		},
		get childrenToShow() {
			return state.maxChildren ? this.childrenArray.slice(0, state.maxChildren) : this.childrenArray
		},
	})

	return (
		<dynamic tag={state.tag} class={state.class}>
			<h3>{state.title}</h3>
			<p>{state.description}</p>
			{state.showChildren && <div class="children">{computed.childrenToShow}</div>}
		</dynamic>
	)
}

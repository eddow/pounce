import { memoize } from 'mutts'
import { defaults } from '../../lib'
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
	const vm = defaults(props, {
		title: 'Wrapper Component',
		description: 'This wrapper contains children:',
		class: 'wrapper',
		showChildren: true,
		tag: 'div',
	})

	const computed = memoize({
		get childrenArray() {
			return Array.isArray(vm.children) ? vm.children : vm.children ? [vm.children] : []
		},
		get childrenToShow() {
			return vm.maxChildren ? this.childrenArray.slice(0, vm.maxChildren) : this.childrenArray
		},
	})

	return (
		<dynamic tag={vm.tag} class={vm.class}>
			<h3>{vm.title}</h3>
			<p>{vm.description}</p>
			{vm.showChildren && <div class="children">{computed.childrenToShow}</div>}
		</dynamic>
	)
}

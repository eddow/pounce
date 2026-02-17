import { effect } from 'mutts'
import { extend } from '../../lib'

export interface MiniCounterProps {
	list?: string[]
	addedText?: string
}

export function MiniCounter(props: MiniCounterProps) {
	const state = extend({ list: [] as string[], addedText: Date.now().toString() }, props)
	effect(({ reaction }) => {
		if (reaction) {
			console.log('MiniCounter component re-running due to reactive change')
		}
		console.log('🎯 Mini counter component mounted!')
		return () => {
			console.log('🎯 Counter component unmounted!', { finalList: state.list.join(', ') })
		}
	})
	function add() {
		state.list.push(state.addedText)
		state.addedText = Date.now().toString()
	}
	function removeAll() {
		state.list.splice(0)
	}
	return (
		<>
			<div>
				<for each={state.list}>
					{(v: string) => (
						<button class="remove" onClick={() => state.list.splice(state.list.indexOf(v), 1)}>
							{v}
						</button>
					)}
				</for>
			</div>
			<div>
				<input type="text" value={state.addedText} />
				<button class="add" onClick={add}>
					+
				</button>
			</div>
			<button if={state.list.length > 0} class="remove-all" onClick={removeAll}>
				Remove All
			</button>
		</>
	)
}

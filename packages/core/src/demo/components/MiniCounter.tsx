import { effect, onEffectTrigger, project } from 'mutts'
import { compose, type Scope } from '../../lib'

export interface MiniCounterProps {
	list?: string[]
	addedText?: string
}

export function MiniCounter(props: MiniCounterProps, scope: Scope) {
	onEffectTrigger((obj, evolution) => {
		console.log(obj, evolution)
	})
	const state = compose({ list: [] as string[], addedText: Date.now().toString() }, props)
	console.log('🎯 Mini counter component mounted!', { scope: scope })
	effect(() => {
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
				{project(state.list, ({ get, key }) => (
					<button class="remove" onClick={() => state.list.splice(key, 1)}>
						{get()}
					</button>
				))}
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

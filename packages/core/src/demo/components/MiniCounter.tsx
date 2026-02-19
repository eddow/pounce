import { defaulted } from '@pounce/core'
import { effect } from 'mutts'
import { captureLineage } from 'mutts/debug'

export interface MiniCounterProps {
	list?: string[]
	addedText?: string
}

export function MiniCounter(props: MiniCounterProps) {
	const vm = defaulted(props, { list: [] as string[], addedText: Date.now().toString() })
	effect(({ reaction }) => {
		if (reaction) {
			console.log('MiniCounter component re-running due to reactive change')
		}
		console.log('🎯 Mini counter component mounted!', captureLineage())
		return (reason) => {
			console.log('🎯 Counter component unmounted!', { finalList: vm.list.join(', ') }, reason)
		}
	})
	function add() {
		vm.list.push(vm.addedText)
		vm.addedText = Date.now().toString()
	}
	function removeAll() {
		vm.list.splice(0)
	}
	return (
		<>
			<div>
				<for each={vm.list}>
					{(v: string) => (
						<button class="remove" onClick={() => vm.list.splice(vm.list.indexOf(v), 1)}>
							{v}
						</button>
					)}
				</for>
			</div>
			<div>
				<input type="text" value={vm.addedText} />
				<button class="add" onClick={add}>
					+
				</button>
			</div>
			<button if={vm.list.length > 0} class="remove-all" onClick={removeAll}>
				Remove All
			</button>
		</>
	)
}
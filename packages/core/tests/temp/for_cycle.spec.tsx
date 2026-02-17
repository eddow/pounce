// Test to verify the issue and potential fix
import { describe, it, expect } from 'vitest'
import { reactive } from 'mutts'
import { h, rootScope } from '@pounce/core'

describe('For component cycle debug', () => {
	it('should not have cycle when pushing to empty array', () => {
		const items = reactive([] as string[])
		
		function Comp() {
			return (
				<div>
					<for each={items}>
						{(v: string) => <button class="remove">{v}</button>}
					</for>
				</div>
			)
		}
		
		const mount = <Comp />
		const root = mount.render(rootScope) as HTMLElement
		
		console.log('Initial render OK')
		
		// This should not cause a cycle
		items.push('test')
		
		console.log('Push OK, checking DOM')
		console.log('Root HTML:', root.innerHTML)
		
		expect(root.querySelector('button.remove')).toBeTruthy()
	})
})

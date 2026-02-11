/**
 * Unit test for Radio component with reactive checked prop
 * Tests the pattern: checked={state.value === 'a'}
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { Radio } from '../../src/components/forms'
import { setAdapter, resetAdapter } from '../../src/adapter/registry'
import { vanillaAdapter } from '../../src/adapter/vanilla'
import { reactive } from 'mutts'

describe('Radio with reactive checked prop', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		setAdapter(vanillaAdapter)
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		if (unmount) unmount()
		container.remove()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	it('should handle reactive group binding without warnings', () => {
		const warnSpy = vi.spyOn(console, 'warn')
		const radioState = reactive({ value: 'a' })

		render(
			<div>
				<Radio name="test" value="a" group={radioState.value}>
					Option A
				</Radio>
				<Radio name="test" value="b" group={radioState.value}>
					Option B
				</Radio>
			</div>
		)

		// Click on radio B to trigger reactive update
		const radioB = container.querySelectorAll('input[type="radio"]')[1] as HTMLInputElement
		radioB.click()

		// Verify no warnings about two-way binding
		const bindingWarnings = warnSpy.mock.calls.filter(call => 
			call.some(arg => typeof arg === 'string' && arg.includes('not a two-way binding'))
		)
		expect(bindingWarnings).toHaveLength(0)

		warnSpy.mockRestore()
	})

	it('should update checked state reactively via group', () => {
		const radioState = reactive({ value: 'a' })

		render(
			<div>
				<Radio name="test" value="a" group={radioState.value}>
					Option A
				</Radio>
				<Radio name="test" value="b" group={radioState.value}>
					Option B
				</Radio>
			</div>
		)

		const [radioA, radioB] = container.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>

		// Initially, radio A should be checked
		expect(radioA.checked).toBe(true)
		expect(radioB.checked).toBe(false)

		// Click on radio B
		radioB.click()
		expect(radioState.value).toBe('b')
		expect(radioA.checked).toBe(false)
		expect(radioB.checked).toBe(true)

		// Click on radio A
		radioA.click()
		expect(radioState.value).toBe('a')
		expect(radioA.checked).toBe(true)
		expect(radioB.checked).toBe(false)
	})

	it('should keep working through multiple group cycles (3 radios)', () => {
		const radioState = reactive({ value: 'a' })

		render(
			<div>
				<Radio name="cycle" value="a" group={radioState.value}>A</Radio>
				<Radio name="cycle" value="b" group={radioState.value}>B</Radio>
				<Radio name="cycle" value="c" group={radioState.value}>C</Radio>
			</div>
		)

		const radios = container.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>
		const [rA, rB, rC] = radios

		const expectChecked = (a: boolean, b: boolean, c: boolean, val: string) => {
			expect(radioState.value).toBe(val)
			expect(rA.checked).toBe(a)
			expect(rB.checked).toBe(b)
			expect(rC.checked).toBe(c)
		}

		expectChecked(true, false, false, 'a')

		rB.click()
		expectChecked(false, true, false, 'b')

		rC.click()
		expectChecked(false, false, true, 'c')

		rA.click()
		expectChecked(true, false, false, 'a')

		// Second full cycle
		rC.click()
		expectChecked(false, false, true, 'c')

		rB.click()
		expectChecked(false, true, false, 'b')

		rA.click()
		expectChecked(true, false, false, 'a')
	})
})

import { document, latch } from '@pounce/core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
	CheckboxFixture,
	ProgressFixture,
	RadioFixture,
	SwitchFixture,
} from '../../demo/sections/FormControls'

describe('control components', () => {
	let container: HTMLElement
	let stop: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		stop?.()
		stop = undefined
		container.remove()
		document.body.innerHTML = ''
	})

	it('keeps model-owned checkbox attributes over passthrough element props', () => {
		stop = latch(container, <CheckboxFixture />)

		const input = container.querySelector('[data-testid="checkbox"]') as HTMLInputElement
		expect(input.checked).toBe(true)
		expect(input.disabled).toBe(true)
	})

	it('keeps model-owned switch attributes over passthrough element props', () => {
		stop = latch(container, <SwitchFixture />)

		const input = container.querySelector('[data-testid="switch"]') as HTMLInputElement
		expect(input.getAttribute('role')).toBe('switch')
		expect(input.getAttribute('aria-checked')).not.toBe('false')
	})

	it('keeps model-owned radio attributes over passthrough element props', () => {
		stop = latch(container, <RadioFixture />)

		const input = container.querySelector('[data-testid="radio"]') as HTMLInputElement
		expect(input.checked).toBe(true)
		expect(input.disabled).toBe(true)
		expect(input.name).toBe('color')
	})

	it('keeps model-owned progress attributes over passthrough element props', () => {
		stop = latch(container, <ProgressFixture />)

		const progress = container.querySelector('[data-testid="progress"]') as HTMLProgressElement
		expect(progress.value).toBe(40)
		expect(progress.max).toBe(100)
		expect(progress.getAttribute('role')).toBe('progressbar')
	})
})

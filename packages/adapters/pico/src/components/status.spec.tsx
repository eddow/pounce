import { document, latch } from '@sursaut/core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BadgeFixture, ChipFixture, PillFixture } from '../../demo/sections/Status'

describe('status components', () => {
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

	it('keeps badge adapter classes while preserving passthrough classes', () => {
		stop = latch(container, <BadgeFixture />)

		const badge = container.querySelector('[data-testid="badge"]') as HTMLSpanElement
		expect(badge.className).toContain('sursaut-badge')
		expect(badge.className).toContain('custom-badge')
		expect(badge.getAttribute('data-variant')).toBe('danger')
	})

	it('keeps pill adapter classes while preserving passthrough classes', () => {
		stop = latch(container, <PillFixture />)

		const pill = container.querySelector('[data-testid="pill"]') as HTMLSpanElement
		expect(pill.className).toContain('sursaut-pill')
		expect(pill.className).toContain('custom-pill')
		expect(pill.getAttribute('data-variant')).toBe('success')
	})

	it('keeps chip adapter class while preserving passthrough classes', () => {
		stop = latch(container, <ChipFixture />)

		const chip = container.querySelector('[data-testid="chip"]') as HTMLElement
		expect(chip.className).toContain('chip')
		expect(chip.className).toContain('custom-chip')
	})
})

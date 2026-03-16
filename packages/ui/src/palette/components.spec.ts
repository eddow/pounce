import { document, rootEnv } from '@sursaut/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import './components'
import { createPaletteKeys } from './keys'
import type { Palette } from './types'

type PaletteRootEnv = typeof rootEnv & {
	paletteRoot?: (element: HTMLElement, palette: Palette) => (() => void) | undefined
}

function testPalette(run: () => void): Palette {
	return {
		tools: {
			run: {
				get can() {
					return true
				},
				run,
			},
		},
		keys: createPaletteKeys({
			N: 'run',
		}),
	}
}

function attachPaletteRoot(element: HTMLElement, palette: Palette): (() => void) | undefined {
	return (rootEnv as PaletteRootEnv).paletteRoot?.(element, palette)
}

describe('paletteRoot', () => {
	afterEach(() => {
		document.body.replaceChildren()
	})

	it('ignores shortcuts triggered from editable descendants', () => {
		const run = vi.fn()
		const root = document.createElement('div')
		const input = document.createElement('input')
		root.appendChild(input)
		document.body.appendChild(root)
		const cleanup = attachPaletteRoot(root, testPalette(run))

		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }))

		expect(run).not.toHaveBeenCalled()
		cleanup?.()
	})

	it('ignores shortcuts when a child already consumed the event', () => {
		const run = vi.fn()
		const root = document.createElement('div')
		const child = document.createElement('button')
		root.appendChild(child)
		document.body.appendChild(root)
		const cleanup = attachPaletteRoot(root, testPalette(run))

		child.addEventListener('keydown', (event) => {
			event.preventDefault()
		})
		child.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }))

		expect(run).not.toHaveBeenCalled()
		cleanup?.()
	})
})

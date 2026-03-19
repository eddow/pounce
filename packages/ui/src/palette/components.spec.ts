import { document, rootEnv } from '@sursaut/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import './components'
import { createPaletteKeys } from './keys'
import { palettes } from './palette'
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
		palettes.editing = undefined
		palettes.dragging = undefined
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

	it('runs bound command shortcuts from the palette root', () => {
		const run = vi.fn()
		const root = document.createElement('div')
		document.body.appendChild(root)
		const cleanup = attachPaletteRoot(root, testPalette(run))

		const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true })
		const stopPropagation = vi.spyOn(event, 'stopPropagation')
		root.dispatchEvent(event)

		expect(run).toHaveBeenCalledTimes(1)
		expect(event.defaultPrevented).toBe(true)
		expect(stopPropagation).toHaveBeenCalledTimes(1)
		cleanup?.()
	})

	it('does not run disabled command shortcuts but still consumes the event', () => {
		const run = vi.fn()
		const root = document.createElement('div')
		document.body.appendChild(root)
		const palette: Palette = {
			tools: {
				run: {
					get can() {
						return false
					},
					run,
				},
			},
			keys: createPaletteKeys({
				N: 'run',
			}),
		}
		const cleanup = attachPaletteRoot(root, palette)

		const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true })
		root.dispatchEvent(event)

		expect(run).not.toHaveBeenCalled()
		expect(event.defaultPrevented).toBe(true)
		cleanup?.()
	})

	it('toggles boolean tools from keyboard shortcuts', () => {
		const root = document.createElement('div')
		document.body.appendChild(root)
		const notifications = {
			type: 'boolean' as const,
			value: false,
			default: false,
		}
		const palette: Palette = {
			tools: {
				notifications,
			},
			keys: createPaletteKeys({
				N: 'notifications',
			}),
		}
		const cleanup = attachPaletteRoot(root, palette)

		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }))
		expect(notifications.value).toBe(true)

		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }))
		expect(notifications.value).toBe(false)
		cleanup?.()
	})

	it('removes the root listener on cleanup', () => {
		const run = vi.fn()
		const root = document.createElement('div')
		document.body.appendChild(root)
		const cleanup = attachPaletteRoot(root, testPalette(run))

		cleanup?.()
		root.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }))

		expect(run).not.toHaveBeenCalled()
	})

	it('reflects editing and dragging state on the root element', () => {
		const run = vi.fn()
		const root = document.createElement('div')
		const palette = testPalette(run)
		document.body.appendChild(root)
		const cleanup = attachPaletteRoot(root, palette)

		palettes.editing = palette
		expect(root.dataset.editing).toBe('true')
		expect(root.classList.contains('palette-editing')).toBe(true)

		palettes.dragging = {
			border: [],
			createdTracks: [],
			index: 0,
			palette,
			region: 'top',
			sourceItems: [],
			sourceBorder: [],
			sourceRegion: 'top',
			sourceTrack: [],
			sourceTrackIndex: 0,
			sourceTrackWasSingleton: false,
			toolbar: [],
			track: [],
			trackIndex: 0,
		}
		expect(root.dataset.dragging).toBe('true')
		expect(root.classList.contains('palette-dragging')).toBe(true)

		cleanup?.()
		palettes.editing = undefined
		palettes.dragging = undefined
	})
})

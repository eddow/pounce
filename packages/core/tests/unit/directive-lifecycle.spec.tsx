import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { reactive, unreactive } from 'mutts'
import { document, latch } from '@sursaut/core'

describe('directive lifecycle semantics', () => {
	let container: HTMLElement
	let stop: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
	})

	afterEach(() => {
		stop?.()
		stop = undefined
		container.remove()
	})

	it('calls `this` with undefined on unlatch', () => {
		const calls: Array<Node | readonly Node[] | undefined> = []

		stop = latch(container, <div this={(mounted: Node | readonly Node[] | undefined) => { calls.push(mounted) }} />)
		expect(calls).toHaveLength(1)
		expect(calls[0]).toBeInstanceOf(Node)

		stop()
		stop = undefined

		expect(calls).toHaveLength(2)
		expect(calls[1]).toBeUndefined()
	})

	it('runs bare `use` cleanup on unlatch', () => {
		const events: string[] = []
		const onMount = () => {
			events.push('mount')
			return () => {
				events.push('cleanup')
			}
		}

		stop = latch(container, <div use={onMount} />)
		expect(events).toEqual(['mount'])

		stop()
		stop = undefined

		expect(events).toEqual(['mount', 'cleanup'])
	})

	it('runs `use:name` cleanup on argument change and on unlatch', () => {
		const state = reactive({ value: 'first' })
		const events: string[] = []
		const env = unreactive({
			resize: (_target: Node | readonly Node[], value: string) => {
				events.push(`mount:${value}`)
				return () => {
					events.push(`cleanup:${value}`)
				}
			},
		})

		stop = latch(container, <div use:resize={state.value} />, env)
		expect(events).toEqual(['mount:first'])

		state.value = 'second'
		expect(events).toEqual(['mount:first', 'cleanup:first', 'mount:second'])

		stop()
		stop = undefined
		expect(events).toEqual(['mount:first', 'cleanup:first', 'mount:second', 'cleanup:second'])
	})
})

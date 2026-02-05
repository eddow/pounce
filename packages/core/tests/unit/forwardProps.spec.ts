/**
 * Test props forwarding functionality
 */
import { reactive } from 'mutts'
import { forwardProps } from '@pounce/core'
import { describe, test, expect } from 'vitest'

describe('forwardProps', () => {
    test('should forward getters and setters', () => {
        const state = reactive({ value: 'initial' })
        const props = {
            get value() { return state.value },
            set value(v) { state.value = v },
            static: 'static'
        }

        const forwarded = forwardProps(props)

        expect(forwarded.value).toHaveProperty('get')
        expect(forwarded.value).toHaveProperty('set')
        expect(forwarded.value.get()).toBe('initial')
        
        forwarded.value.set('updated')
        expect(state.value).toBe('updated')
        expect(forwarded.static).toBe('static')
    })
})


/**
 * Test edge cases for property handling
 */
import { describe, expect, test } from 'vitest'
import { h } from '@pounce/core'

describe('edgeProps', () => {
    test('should explain why property set fails', () => {
        const comp = (props: { value: string }) => {
            'use strict'
            props.value = 'test'
            return []
        }

        // Assigning to a one-way binding in strict mode should throw a TypeError
        // because its descriptor has writable: false
        expect(() => {
            let inst = h(comp, { value: () => 'initial' })
            inst.render({})
        }).toThrow(TypeError)
    })
})


/**
 * Test edge cases for property handling
 */
import { describe, test } from 'vitest'
import { h, pounceOptions } from '@pounce/core'

describe('edgeProps', () => {
    test('should explain why property set fails', () => {
        //TODO: play with pounceOptions.writeRoProps
        const comp = (props: { value: string }) => {
            props.value = 'test'
            return []
        }

        const oldInitial = pounceOptions.writeRoProps
        pounceOptions.writeRoProps = 'ignore'

        let inst = h(comp, { value: 'initial' })
        inst.render({})
        inst = h(comp, { value: () => 'initial' })
        inst.render({})

        pounceOptions.writeRoProps = oldInitial


        //expect(() => h(Comp, { value: 'initial' })).toThrow()
    })
})


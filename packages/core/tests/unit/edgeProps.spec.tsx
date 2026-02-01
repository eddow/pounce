import { describe, test } from 'vitest'
import { h } from '@pounce/core'

describe('edgeProps', () => {
    test('should explain why property set fails', () => {
        //TODO: play with pounceOptions.writeRoProps
        const comp = (props: { value: string }) => {
            props.value = 'test'
            return []
        }

        let inst = h(comp, { value: 'initial' })
        inst.render({})
        inst = h(comp, { value: () => 'initial' })
        inst.render({})


        //expect(() => h(Comp, { value: 'initial' })).toThrow()
    })
})


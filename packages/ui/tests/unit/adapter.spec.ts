import { describe, beforeEach, it, expect } from 'vitest'
import { setAdapter, getAdapter, resetAdapter } from '../../src/adapter/registry'
import type { FrameworkAdapter } from '../../src/adapter/types'

describe('Adapter Registry', () => {
  beforeEach(() => {
    resetAdapter()
  })

  it('sets and gets global adapter config', () => {
    const mockAdapter: FrameworkAdapter = {
      components: {
        Button: { classes: { base: 'custom-btn' } }
      }
    }
    
    setAdapter(mockAdapter)
    
    expect(getAdapter('Button')).toEqual(mockAdapter.components!.Button)
  })

  it('merges multiple adapter updates', () => {
    setAdapter({ components: { Button: { classes: { base: 'btn' } } } })
    setAdapter({ components: { Dialog: { transitions: { duration: 100 } } } })
    
    expect(getAdapter('Button').classes?.base).toBe('btn')
    expect(getAdapter('Dialog').transitions?.duration).toBe(100)
  })

  it('throws error if setAdapter is called after getAdapter (SSR safety)', () => {
    getAdapter('Button')
    
    expect(() => {
      setAdapter({ components: { Button: {} } })
    }).toThrow('[pounce/ui] setAdapter() must be called before component rendering.')
  })

  it('resets state between tests', () => {
    setAdapter({ components: { Button: { classes: { base: 'btn' } } } })
    resetAdapter()
    expect(getAdapter('Button')).toEqual({})
  })
})

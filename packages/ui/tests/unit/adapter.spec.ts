import { describe, it, expect, beforeEach } from 'vitest'
import { setAdapter, getAdapter, __resetAdapter } from '../../src/adapter/registry'

describe('Adapter Registry', () => {
  beforeEach(() => {
    __resetAdapter()
  })

  it('sets and gets global adapter config', () => {
    const mockAdapter = {
      Button: { classes: { base: 'custom-btn' } }
    }
    
    setAdapter(mockAdapter)
    
    expect(getAdapter('Button')).toEqual(mockAdapter.Button)
  })

  it('merges multiple adapter updates', () => {
    setAdapter({ Button: { classes: { base: 'btn' } } })
    setAdapter({ Dialog: { transitions: { duration: 100 } } })
    
    expect(getAdapter('Button').classes?.base).toBe('btn')
    expect(getAdapter('Dialog').transitions?.duration).toBe(100)
  })

  it('throws error if setAdapter is called after getAdapter (SSR safety)', () => {
    getAdapter('Button')
    
    expect(() => {
      setAdapter({ Button: {} })
    }).toThrow('[pounce/ui] setAdapter() must be called before component rendering.')
  })

  it('resets state between tests', () => {
    setAdapter({ Button: { classes: { base: 'btn' } } })
    __resetAdapter()
    expect(getAdapter('Button')).toEqual({})
  })
})

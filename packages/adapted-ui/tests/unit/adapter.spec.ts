import { describe, beforeEach, it, expect, vi } from 'vitest'
import { setAdapter, getAdapter, getGlobalAdapter, resetAdapter } from '../../src/adapter/registry'
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

  it('supports global iconFactory', () => {
    const mockIconFactory = vi.fn((name: string) => ({ type: 'span', props: { children: name } }))
    
    setAdapter({
      iconFactory: mockIconFactory as any
    })
    
    const globalAdapter = getGlobalAdapter()
    expect(globalAdapter.iconFactory).toBe(mockIconFactory)
  })

  it('supports global variants', () => {
    setAdapter({
      variants: {
        primary: 'my-primary',
        danger: 'my-danger'
      }
    })
    
    const globalAdapter = getGlobalAdapter()
    expect(globalAdapter.variants?.primary).toBe('my-primary')
    expect(globalAdapter.variants?.danger).toBe('my-danger')
  })

  it('supports global transitions', () => {
    setAdapter({
      transitions: {
        duration: 300,
        enterClass: 'fade-in'
      }
    })
    
    const globalAdapter = getGlobalAdapter()
    expect(globalAdapter.transitions?.duration).toBe(300)
    expect(globalAdapter.transitions?.enterClass).toBe('fade-in')
  })

  it('provides type-safe component adapters', () => {
    setAdapter({
      components: {
        Button: {
          iconPlacement: 'end',
          classes: { base: 'btn' }
        },
        Dialog: {
          transitions: { duration: 200 },
          classes: { backdrop: 'backdrop' }
        }
      }
    })
    
    const buttonAdapter = getAdapter('Button')
    expect(buttonAdapter.iconPlacement).toBe('end')
    expect(buttonAdapter.classes?.base).toBe('btn')
    
    const dialogAdapter = getAdapter('Dialog')
    expect(dialogAdapter.transitions?.duration).toBe(200)
    expect(dialogAdapter.classes?.backdrop).toBe('backdrop')
  })
})

describe('Icon Component Integration', () => {
  beforeEach(() => {
    resetAdapter()
  })

  it('Icon component uses global iconFactory when configured', () => {
    const mockFactory = vi.fn((name: string) => ({ type: 'i', props: { class: `icon-${name}` } }))
    
    setAdapter({
      iconFactory: mockFactory as any
    })
    
    const globalAdapter = getGlobalAdapter()
    expect(globalAdapter.iconFactory).toBe(mockFactory)
  })
})

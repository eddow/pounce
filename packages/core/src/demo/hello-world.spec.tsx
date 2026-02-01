import { describe, it, expect } from 'vitest'
import { h } from '../lib'
import { rootScope } from '../lib/renderer'
import { HelloWorld } from './hello-world'

describe('HelloWorld Component', () => {
  it('renders with default props', () => {
    const mount = h(HelloWorld, {})
    const root = (mount.render(rootScope) as HTMLElement[])[0]
    
    const greetingElement = root.querySelector('.greeting')
    const messageElement = root.querySelector('.message')
    
    expect(greetingElement?.textContent).toBe('Hello, World!')
    expect(messageElement?.textContent).toBe('Welcome to Pounce components')
  })

  it('renders with custom name', () => {
    const mount = h(HelloWorld, { name: 'Alice' })
    const root = (mount.render(rootScope) as HTMLElement[])[0]
    
    const greetingElement = root.querySelector('.greeting')
    expect(greetingElement?.textContent).toBe('Hello, Alice!')
  })

  it('renders with custom greeting', () => {
    const mount = h(HelloWorld, { greeting: 'Hi', name: 'Bob' })
    const root = (mount.render(rootScope) as HTMLElement[])[0]
    
    const greetingElement = root.querySelector('.greeting')
    expect(greetingElement?.textContent).toBe('Hi, Bob!')
  })

  it('has correct CSS classes', () => {
    const mount = h(HelloWorld, {})
    const root = (mount.render(rootScope) as HTMLElement[])[0]
    
    // The root element itself should have the hello-world class
    expect(root.classList.contains('hello-world')).toBe(true)
    
    const greetingElement = root.querySelector('.greeting')
    const messageElement = root.querySelector('.message')
    
    expect(greetingElement).toBeTruthy()
    expect(messageElement).toBeTruthy()
  })

  it('renders h1 and p elements with correct tags', () => {
    const mount = h(HelloWorld, {})
    const root = (mount.render(rootScope) as HTMLElement[])[0]
    
    const h1Element = root.querySelector('h1')
    const pElement = root.querySelector('p')
    
    expect(h1Element?.tagName).toBe('H1')
    expect(pElement?.tagName).toBe('P')
    expect(h1Element?.classList.contains('greeting')).toBe(true)
    expect(pElement?.classList.contains('message')).toBe(true)
  })
})

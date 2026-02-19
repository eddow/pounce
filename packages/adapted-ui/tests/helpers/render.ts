import { latch } from '@pounce/core'

export function render(component: JSX.Element, container?: HTMLElement) {
  const target = container || document.createElement('div')
  document.body.appendChild(target)
  
  const cleanup = latch(target, component)
  
  return {
    container: target,
    cleanup: () => {
      cleanup()
      target.remove()
    }
  }
}

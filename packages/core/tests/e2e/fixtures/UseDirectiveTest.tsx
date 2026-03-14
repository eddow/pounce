import { reactive, latch } from '@sursaut'
import { rootEnv } from '@sursaut'

// Test custom use: directive
rootEnv.focus = (element: HTMLElement, value: any, access: any) => {
  console.log('focus directive called with:', { element: element.tagName, value, access })
  if (value) {
    element.focus()
  }
  return () => console.log('focus cleanup')
}

export default function UseDirectiveTest() {
  const state = reactive({
    shouldFocus: false
  })

  return (
    <div>
      <h1>use: Directive Test</h1>
      <input 
        data-testid="focus-input"
        use:focus={state.shouldFocus}
        placeholder="This should focus when shouldFocus is true"
      />
      <button 
        data-testid="toggle-focus"
        onClick={() => state.shouldFocus = !state.shouldFocus}
      >
        Toggle Focus
      </button>
      <p>Should Focus: <span data-testid="focus-status">{state.shouldFocus ? 'Yes' : 'No'}</span></p>
    </div>
  )
}

import { reactive, latch } from '@pounce'
import { rootEnv } from '@pounce'

// Test use:focus without value (should default to true)
rootEnv.focus = (element: HTMLElement, value: any, access: any) => {
  console.log('focus directive called with:', { element: element.tagName, value })
  // Default to true if no value provided
  if (value !== false) {
    element.focus()
  }
  return () => console.log('focus cleanup')
}

export default function UseDirectiveDefaultValueTest() {
  const state = reactive({
    showInput: true
  })

  return (
    <div>
      <h1>use: Directive Default Value Test</h1>
      
      {/* Test without explicit value - should default to true */}
      {state.showInput && (
        <input 
          data-testid="focus-input-default"
          use:focus
          placeholder="This should auto-focus (no value provided)"
        />
      )}
      
      {/* Test with explicit true */}
      <input 
        data-testid="focus-input-true"
        use:focus={true}
        placeholder="This should auto-focus (explicit true)"
      />
      
      {/* Test with explicit false */}
      <input 
        data-testid="focus-input-false"
        use:focus={false}
        placeholder="This should NOT focus (explicit false)"
      />
      
      <button 
        data-testid="toggle-input"
        onClick={() => state.showInput = !state.showInput}
      >
        Toggle Input
      </button>
    </div>
  )
}

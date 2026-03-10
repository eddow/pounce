import { reactive } from 'mutts'

export default function IfReactivityTest() {
  const state = reactive({ 
    loggedIn: false,
    userRole: 'guest' as 'guest' | 'admin'
  })

  // Env is NOT reactive - changes won't trigger re-renders
  const env = {
    role: state.userRole,  // This is a static snapshot, not reactive
    hasRights: (right: string) => {
      console.log('hasRights called with:', right, 'current role:', env.role)
      return env.role === 'admin' && right === 'edit'
    }
  }

  return (
    <div>
      <h1>if= vs if:path Reactivity Test</h1>
      
      {/* Reactive if= - will re-render when state.loggedIn changes */}
      <div if={state.loggedIn}>
        <p data-testid="reactive-if">Reactive if: You are logged in!</p>
      </div>
      
      {/* Non-reactive if:role - will NOT re-render when env.role changes */}
      <div if:role="admin">
        <p data-testid="env-if">Env if: Admin content (static)</p>
      </div>
      
      {/* when: predicate - also non-reactive */}
      <div when:hasRights="edit">
        <p data-testid="env-when">Env when: Has edit rights (static)</p>
      </div>
      
      {/* else - shows if none of the above conditions match */}
      <div else>
        <p data-testid="else-content">Else: No conditions matched</p>
      </div>
      
      <button 
        data-testid="toggle-login"
        onClick={() => {
          state.loggedIn = !state.loggedIn
          // Also change env.role to show it doesn't trigger re-render
          env.role = state.loggedIn ? 'admin' : 'guest'
        }}
      >
        Toggle Login (and env.role)
      </button>
      
      <p>
        State: loggedIn={state.loggedIn ? 'true' : 'false'}, 
        Env role: {env.role}
      </p>
    </div>
  )
}

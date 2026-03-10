// Comprehensive example showing the difference between reactive and non-reactive conditions
import { reactive } from 'mutts'

export default function ConditionalRenderingExample() {
  const state = reactive({ 
    loggedIn: false,
    userRole: 'guest' as 'guest' | 'admin' | 'user'
  })

  // Env properties are static snapshots - NOT reactive
  const env = {
    role: state.userRole,  // Static value at render time
    isAuthenticated: state.loggedIn,  // Static value at render time
    canEdit: () => env.role === 'admin',  // Static check
    hasPermission: (permission: string) => {
      switch (permission) {
        case 'edit': return env.role === 'admin'
        case 'view': return ['admin', 'user'].includes(env.role)
        default: return false
      }
    }
  }

  return (
    <div>
      <h1>Conditional Rendering Examples</h1>
      
      {/* ✅ REACTIVE: Will update when state.loggedIn changes */}
      <section>
        <h3>Reactive Conditions (use these for dynamic content)</h3>
        <div if={state.loggedIn}>
          <p>✅ Reactive if: Welcome back!</p>
        </div>
        <div if={!state.loggedIn}>
          <p>✅ Reactive if: Please log in</p>
        </div>
      </section>

      {/* ❌ NON-REACTIVE: Will NOT update when env properties change */}
      <section>
        <h3>Non-Reactive Conditions (static at render time)</h3>
        <div if:role="admin">
          <p>❌ Env if: Admin panel (static)</p>
        </div>
        <div if:isAuthenticated="true">
          <p>❌ Env if: Authenticated content (static)</p>
        </div>
        <div when:canEdit="">
          <p>❌ Env when: Can edit (static)</p>
        </div>
        <div when:hasPermission="view">
          <p>❌ Env when: Has view permission (static)</p>
        </div>
      </section>

      {/* else shows if no preceding conditions matched */}
      <section>
        <h3>Fallback</h3>
        <div else>
          <p>🔄 Else: No conditions matched - this shows if all above fail</p>
        </div>
      </section>

      <section>
        <h3>Controls</h3>
        <button onClick={() => state.loggedIn = !state.loggedIn}>
          Toggle Login (reactive)
        </button>
        <button onClick={() => {
          const roles = ['guest', 'user', 'admin'] as const
          const currentIndex = roles.indexOf(state.userRole)
          state.userRole = roles[(currentIndex + 1) % roles.length]
          // Note: Changing state.userRole won't update env.role!
        }}>
          Change Role (reactive state, but env is static)
        </button>
      </section>

      <section>
        <h3>Current State</h3>
        <p>State: loggedIn={state.loggedIn ? 'true' : 'false'}, role={state.userRole}</p>
        <p>Env: role={env.role}, isAuthenticated={env.isAuthenticated ? 'true' : 'false'}</p>
        <p>💡 Tip: Change the state and see how only reactive conditions update!</p>
      </section>
    </div>
  )
}

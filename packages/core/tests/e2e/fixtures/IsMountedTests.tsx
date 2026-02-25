import { reactive, effect } from 'mutts'
import { isMounted } from '@pounce/core'

export default function IsMountedTests() {
	const state = reactive({
		show: false,
		mountedCount: 0,
		unmountedCount: 0
	})

	const el = document.createElement('div')
	el.id = 'tracked-element'
	el.textContent = 'I am tracked'

	effect(() => {
		if (isMounted(el)) {
			state.mountedCount++
		} else {
			state.unmountedCount++
		}
	})

	return (
		<div>
			<h2>isMounted Test</h2>
			<button id="toggle-mount" onClick={() => state.show = !state.show}>
				Toggle Mount
			</button>
			<div id="mount-container">
				{state.show ? el : null}
			</div>
			<div id="status">
				<p>Mounted Count: <span id="mounted-count">{state.mountedCount}</span></p>
				<p>Unmounted Count: <span id="unmounted-count">{state.unmountedCount}</span></p>
				<p>Currently Mounted: <span id="is-mounted-status">{isMounted(el) ? 'Yes' : 'No'}</span></p>
			</div>
		</div>
	)
}

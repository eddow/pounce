import { reactive, effect } from 'mutts'

export default function IsMountedTests() {
	const state = reactive({
		show: false,
		mountedCount: 0,
		unmountedCount: 0,
		el: undefined as HTMLDivElement | undefined,
		connected: false,
	})

	effect(() => {
		const node = state.el
		if (!node) {
			state.connected = false
			return
		}
		if (node.isConnected) {
			state.connected = true
			state.mountedCount++
		} else {
			state.connected = false
			state.unmountedCount++
		}
	})

	return (
		<div>
			<h2>node.isConnected Test</h2>
			<button id="toggle-mount" onClick={() => state.show = !state.show}>
				Toggle Mount
			</button>
			<div id="mount-container">
				<div id="tracked-element" if={state.show} this={state.el}>I am tracked</div>
			</div>
			<div id="status">
				<p>Mounted Count: <span id="mounted-count">{state.mountedCount}</span></p>
				<p>Unmounted Count: <span id="unmounted-count">{state.unmountedCount}</span></p>
				<p>Currently Mounted: <span id="is-mounted-status">
					<fragment if={!state.el}>Non-existent</fragment>
					<fragment else if={state.connected}>Yes</fragment>
					<fragment else>No</fragment>
				</span></p>
			</div>
		</div>
	)
}

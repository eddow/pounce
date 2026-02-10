/**
 * E2E fixture for overlay system testing.
 * Renders buttons that trigger each overlay type, plus status indicators.
 */
import { type Scope } from '@pounce/core'
import { StandardOverlays } from '../../../src/overlays/standard-overlays'
import { Dialog } from '../../../src/overlays/dialog'
import { Drawer } from '../../../src/overlays/drawer'
import { Toast } from '../../../src/overlays/toast'

const Controls = (_props: {}, scope: Scope) => {
	const push = scope.overlay as (spec: any) => Promise<any>

	const openDialog = () => {
		push(Dialog.show({
			title: 'Test Dialog',
			message: 'Dialog content for e2e',
			buttons: { cancel: 'Cancel', ok: 'OK' },
		}))
	}

	const openConfirm = () => {
		push(Dialog.show({
			title: 'Confirm Action',
			message: 'Are you sure?',
			buttons: { no: 'No', yes: 'Yes' },
			dismissible: false,
		}))
	}

	const openDrawer = () => {
		push(Drawer.show({
			title: 'Test Drawer',
			children: <p class="drawer-content">Drawer body content</p>,
			footer: <button class="drawer-save" onClick={() => {}}>Save</button>,
		}))
	}

	const openDrawerRight = () => {
		push(Drawer.show({
			title: 'Right Drawer',
			children: <p>Right side content</p>,
			side: 'right',
		}))
	}

	const showToast = () => {
		push(Toast.show('Test notification'))
	}

	const showToastSuccess = () => {
		push(Toast.show({ message: 'Success!', variant: 'success', duration: 5000 }))
	}

	const showToastDanger = () => {
		push(Toast.show({ message: 'Error occurred', variant: 'danger', duration: 5000 }))
	}

	return (
		<div id="overlay-controls">
			<button id="btn-dialog" onClick={openDialog}>Open Dialog</button>
			<button id="btn-confirm" onClick={openConfirm}>Open Confirm</button>
			<button id="btn-drawer" onClick={openDrawer}>Open Drawer</button>
			<button id="btn-drawer-right" onClick={openDrawerRight}>Open Right Drawer</button>
			<button id="btn-toast" onClick={showToast}>Show Toast</button>
			<button id="btn-toast-success" onClick={showToastSuccess}>Show Success Toast</button>
			<button id="btn-toast-danger" onClick={showToastDanger}>Show Danger Toast</button>
		</div>
	)
}

export default function OverlayFixture() {
	return (
		<StandardOverlays>
			<div id="overlay-fixture">
				<h2>Overlay E2E Fixture</h2>
				<Controls />
			</div>
		</StandardOverlays>
	)
}

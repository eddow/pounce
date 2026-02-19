import { bindDialog } from './dialog'
import { bindDrawer } from './drawer'
import { bindToast } from './toast'
import { WithOverlays } from './with-overlays'

export interface StandardOverlaysProps {
	children?: JSX.Children
}

/**
 * The "1-config" wrapper for Pounce applications.
 * Provides the standard set of layers and interaction helpers (dialog, toast, drawer).
 */
export const StandardOverlays = (props: StandardOverlaysProps) => {
	return (
		<WithOverlays
			layers={['modal', 'drawer-left', 'drawer-right', 'toast']}
			extend={{
				dialog: (push) => bindDialog(push),
				toast: (push) => bindToast(push),
				drawer: (push) => bindDrawer(push),
			}}
		>
			{props.children}
		</WithOverlays>
	)
}
